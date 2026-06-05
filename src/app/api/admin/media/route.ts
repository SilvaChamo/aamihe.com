import { NextResponse } from 'next/server';
import path from 'node:path';
import { deleteMediaItem } from '@/lib/media-delete';
import { buildAdminMediaCatalog, upsertMediaRecord } from '@/lib/media-registry';
import { uploadFileToStore } from '@/lib/supabase-media';
import type { MediaCategory } from '@/lib/site-media';
import { inferUploadMimeType } from '@/lib/infer-upload-mime';
import { inferMediaCategory } from '@/lib/site-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import {
  applyCompressedFileName,
  compressImageBuffer,
  isCompressibleImageMime,
} from '@/lib/compress-image-buffer';

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
  if (url.startsWith('/')) {
    throw new Error('URLs locais não são suportados. Use upload para o Supabase Storage.');
  }

  return upsertMediaRecord({
    site_slug: 'aamihe',
    title: title || titleFromUrl(url),
    url,
    category: 'imagens',
    subcategory,
    mime_type: mimeFromUrl(publicUrl),
    source: mediaSource(subcategory),
    published: true,
  });
}

async function prepareImageBuffer(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  if (!isCompressibleImageMime(mimeType)) {
    return { buffer, mimeType, name: originalName };
  }
  const compressed = await compressImageBuffer(buffer, mimeType, originalName);
  return {
    buffer: Buffer.from(compressed.buffer),
    mimeType: compressed.mimeType,
    name: applyCompressedFileName(originalName, compressed.ext),
  };
}

async function processUpload(file: File, subcategory: string, title?: string) {
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let mimeType = inferUploadMimeType(file);
  let fileName = title || file.name;
  if (mimeType.startsWith('image/')) {
    const prepared = await prepareImageBuffer(buffer, mimeType, fileName);
    buffer = prepared.buffer;
    mimeType = prepared.mimeType;
    fileName = prepared.name;
  }
  const category = /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(fileName)
    ? 'imagens'
    : inferMediaCategory(mimeType);
  return uploadFileToStore(buffer, fileName, mimeType, category, subcategory);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as MediaCategory | null;
    const allItems = await buildAdminMediaCatalog();
    const items = category
      ? allItems.filter((item) => item.category === category)
      : allItems;
    return NextResponse.json(
      { success: true, media: items, supabase: isSupabaseConfigured() },
      { headers: { 'Cache-Control': 'no-store' } },
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
          String(form.get('title') || 'Imagem'),
        );
        return NextResponse.json({ success: true, media: record });
      }
    }

    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ success: false, error: 'Formato inválido' }, { status: 400 });
      }
      let buffer: Buffer = Buffer.from(match[2], 'base64');
      let mimeType = match[1];
      let title = String(form.get('title') || 'imagem');
      if (mimeType.startsWith('image/')) {
        const prepared = await prepareImageBuffer(buffer, mimeType, title);
        buffer = prepared.buffer;
        mimeType = prepared.mimeType;
        title = prepared.name;
      }
      const record = await uploadFileToStore(buffer, title, mimeType, 'imagens', subcategory);
      await upsertMediaRecord(record);
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
      const record = await processUpload(file, subcategory, file.name);
      await upsertMediaRecord(record);
      uploaded.push(record);
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || '').trim();
    const url = String(body.url || '').trim();
    if (!id && !url) {
      return NextResponse.json({ success: false, error: 'ID ou URL em falta' }, { status: 400 });
    }

    const catalog = await buildAdminMediaCatalog();
    const record =
      catalog.find((m) => (id && m.id === id) || (url && m.url === url)) ?? null;

    if (!record) {
      return NextResponse.json({ success: false, error: 'Item não encontrado.' }, { status: 404 });
    }

    const updated = await upsertMediaRecord({
      ...record,
      title: typeof body.title === 'string' ? body.title.trim() || record.title : record.title,
      alt_text: typeof body.alt_text === 'string' ? body.alt_text : record.alt_text,
      caption: typeof body.caption === 'string' ? body.caption : record.caption,
      description: typeof body.description === 'string' ? body.description : record.description,
    });

    return NextResponse.json({ success: true, media: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar metadados' }, { status: 500 });
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
