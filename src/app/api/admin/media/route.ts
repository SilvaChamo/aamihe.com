import { NextResponse } from 'next/server';
import path from 'node:path';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { buildMediaCatalog, upsertMediaRecord } from '@/lib/media-registry';
import { saveUploadedBuffer } from '@/lib/persist-media';
import type { MediaCategory } from '@/lib/site-media';
import { inferMediaCategory } from '@/lib/site-media';

function extensionFromMime(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  return '.jpg';
}

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

function imageSubfolder(subcategory: string, category: MediaCategory): string {
  if (subcategory === 'Notícias') return 'gallery';
  if (category === 'videos') return 'uploads/videos';
  if (category === 'documentos') return 'uploads/documentos';
  return 'uploads/imagens';
}

function mediaSource(subcategory: string): 'news' | 'upload' {
  return subcategory === 'Notícias' ? 'news' : 'upload';
}

async function registerImageUrl(url: string, subcategory: string, title: string) {
  const db = await getDashboardDb();
  const record = upsertMediaRecord(db, {
    site_slug: 'aamihe',
    title: title || titleFromUrl(url),
    url,
    category: 'imagens',
    subcategory,
    mime_type: mimeFromUrl(url),
    source: mediaSource(subcategory),
    published: true,
  });
  await saveDashboardDb(db);
  return record;
}

async function saveDataUrlImage(dataUrl: string, subcategory: string, title: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato de imagem inválido');
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = extensionFromMime(mimeType);
  const filename = `news-${Date.now()}${ext}`;
  const saved = await saveUploadedBuffer(buffer, filename, imageSubfolder(subcategory, 'imagens'));

  const db = await getDashboardDb();
  const record = upsertMediaRecord(db, {
    site_slug: 'aamihe',
    title,
    url: saved.url,
    category: 'imagens',
    subcategory,
    mime_type: mimeType,
    size: buffer.length,
    source: mediaSource(subcategory),
    published: true,
  });

  await saveDashboardDb(db);
  return record;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as MediaCategory | null;
    const db = await getDashboardDb();
    let items = await buildMediaCatalog(db);
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    return NextResponse.json({ success: true, media: items });
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
    const title = String(form.get('title') || 'Imagem de notícia');

    if (typeof registerUrl === 'string' && registerUrl.startsWith('/')) {
      const record = await registerImageUrl(registerUrl, subcategory, title);
      return NextResponse.json({ success: true, media: record });
    }

    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const record = await saveDataUrlImage(dataUrl, subcategory, title);
      return NextResponse.json({ success: true, media: record });
    }

    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Ficheiro em falta' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const category = (form.get('category') as MediaCategory) || inferMediaCategory(file.type);
    const subfolder = imageSubfolder(subcategory, category);
    const saved = await saveUploadedBuffer(buffer, file.name, subfolder);

    const db = await getDashboardDb();
    const record = upsertMediaRecord(db, {
      site_slug: String(form.get('site_slug') || 'aamihe'),
      title: String(form.get('title') || file.name),
      url: saved.url,
      category,
      subcategory,
      mime_type: file.type || 'application/octet-stream',
      size: file.size,
      source: mediaSource(subcategory),
      published: true,
    });

    await saveDashboardDb(db);
    return NextResponse.json({ success: true, media: record });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro no upload' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID em falta' }, { status: 400 });
    }

    const db = await getDashboardDb();
    db.media = db.media.filter((m) => m.id !== id);
    await saveDashboardDb(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao eliminar' }, { status: 500 });
  }
}
