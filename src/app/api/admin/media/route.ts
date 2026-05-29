import { NextResponse } from 'next/server';
import path from 'node:path';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { deleteMediaItem } from '@/lib/media-delete';
import { buildAdminMediaCatalog, upsertMediaRecord } from '@/lib/media-registry';
import { ensureGalleryFile } from '@/lib/media-storage';
import { uploadFileToStore } from '@/lib/supabase-media';
import type { MediaCategory } from '@/lib/site-media';
import { inferUploadMimeType } from '@/lib/infer-upload-mime';
import { inferMediaCategory } from '@/lib/site-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function mimeFromUrl(url: string): string {
  const ext = path.extname(url).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function titleFromUrl(url: string): string {
  const name = url.split('/').pop() || url;
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRegisterUrl(url: string): string | null {
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    return parsed.pathname || null;
  } catch {
    return null;
  }
}

function mediaSource(subcategory: string): 'news' | 'upload' {
  return subcategory === 'Notícias' ? 'news' : 'upload';
}

async function registerImageUrl(url: string, subcategory: string, title: string) {
  let publicUrl = url;
  if (subcategory === 'Notícias' && url.startsWith('/')) {
    publicUrl = await ensureGalleryFile(url, title);
  }

  const db = await getDashboardDb();
  const record = upsertMediaRecord(db, {
    site_slug: 'aamihe',
    title: title || titleFromUrl(publicUrl),
    url: publicUrl,
    category: 'imagens',
    subcategory,
    mime_type: mimeFromUrl(publicUrl),
    source: mediaSource(subcategory),
    published: true,
  });
  await saveDashboardDb(db);

  if (isSupabaseConfigured()) {
    const { upsertSupabaseMedia } = await import('@/lib/supabase-media');
    await upsertSupabaseMedia(record);
  }

  return record;
}

async function processUpload(file: File, subcategory: string, title?: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = inferUploadMimeType(file);
  const category = /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name)
    ? 'imagens'
    : inferMediaCategory(mimeType);
  const record = await uploadFileToStore(buffer, title || file.name, mimeType, category, subcategory);

  const db = await getDashboardDb();
  upsertMediaRecord(db, record);
  await saveDashboardDb(db);

  return record;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as MediaCategory | null;
    const db = await getDashboardDb();
    // Uma fonte: Supabase + dashboard (sem varrer public/ — evita duplicar o que já está na BD)
    const allItems = await buildAdminMediaCatalog(db);
    const items = category
      ? allItems.filter((item) => item.category === category)
      : allItems;
    return NextResponse.json(
      { success: true, media: items, supabase: isSupabaseConfigured() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar multimédia' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const dataUrl = form.get('data_url');
    const registerUrl = form.get('register_url');
    const subcategory = String(form.get('subcategory') || 'Upload');

    if (typeof registerUrl === 'string') {
      const pathUrl = normalizeRegisterUrl(registerUrl);
      if (pathUrl || registerUrl.startsWith('http')) {
        const record = await registerImageUrl(
          pathUrl || registerUrl,
          subcategory,
          String(form.get('title') || 'Imagem')
        );
        return NextResponse.json({ success: true, media: record });
      }
    }

    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ success: false, error: 'Formato inválido' }, { status: 400 });
      }
      const buffer = Buffer.from(match[2], 'base64');
      const mimeType = match[1];
      const title = String(form.get('title') || 'imagem');
      const record = await uploadFileToStore(buffer, title, mimeType, 'imagens', subcategory);
      const db = await getDashboardDb();
      upsertMediaRecord(db, record);
      await saveDashboardDb(db);
      if (isSupabaseConfigured()) {
        const { upsertSupabaseMedia } = await import('@/lib/supabase-media');
        await upsertSupabaseMedia(record);
      }
      return NextResponse.json({ success: true, media: record });
    }

    const fileEntries = [
      ...form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0),
      ...(form.get('file') instanceof File && (form.get('file') as File).size > 0
        ? [form.get('file') as File]
        : []),
    ];

    if (fileEntries.length === 0) {
      return NextResponse.json({ success: false, error: 'Ficheiro em falta' }, { status: 400 });
    }

    const uploaded = [];
    for (const file of fileEntries) {
      uploaded.push(await processUpload(file, subcategory, file.name));
    }

    return NextResponse.json({
      success: true,
      media: uploaded.length === 1 ? uploaded[0] : uploaded,
      count: uploaded.length,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro no upload';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const url = searchParams.get('url') || undefined;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID em falta' }, { status: 400 });
    }

    const result = await deleteMediaItem({ id, url });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar' }, { status: 500 });
  }
}
