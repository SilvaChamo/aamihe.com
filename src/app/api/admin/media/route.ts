import { NextResponse } from 'next/server';
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

async function saveDataUrlImage(dataUrl: string, subcategory: string, title: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato de imagem inválido');
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = extensionFromMime(mimeType);
  const filename = `news-${Date.now()}${ext}`;
  const saved = await saveUploadedBuffer(buffer, filename, 'uploads/imagens');

  const db = await getDashboardDb();
  const record = upsertMediaRecord(db, {
    site_slug: 'aamihe',
    title,
    url: saved.url,
    category: 'imagens',
    subcategory,
    mime_type: mimeType,
    size: buffer.length,
    source: 'upload',
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

    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
      const record = await saveDataUrlImage(
        dataUrl,
        String(form.get('subcategory') || 'Notícias'),
        String(form.get('title') || 'Imagem de notícia')
      );
      return NextResponse.json({ success: true, media: record });
    }

    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Ficheiro em falta' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const category = (form.get('category') as MediaCategory) || inferMediaCategory(file.type);
    const subfolder = category === 'videos' ? 'uploads/videos' : category === 'documentos' ? 'uploads/documentos' : 'uploads/imagens';
    const saved = await saveUploadedBuffer(buffer, file.name, subfolder);

    const db = await getDashboardDb();
    const record = upsertMediaRecord(db, {
      site_slug: String(form.get('site_slug') || 'aamihe'),
      title: String(form.get('title') || file.name),
      url: saved.url,
      category,
      subcategory: String(form.get('subcategory') || 'Upload'),
      mime_type: file.type || 'application/octet-stream',
      size: file.size,
      source: 'upload',
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
