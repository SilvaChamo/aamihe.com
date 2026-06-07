import { NextResponse } from 'next/server';
import path from 'node:path';
import { fetchMediaBuffer } from '@/lib/fetch-media-buffer';
import { isLocalMediaPath } from '@/lib/media-catalog-key';
import { buildAdminMediaCatalog, invalidateGalleryCatalogCache } from '@/lib/media-registry';
import { saveMediaMetadata } from '@/lib/media-metadata-store';
import type { ImageEditFormat } from '@/lib/resize-image-buffer';
import { resizeImageBuffer } from '@/lib/resize-image-buffer';
import { movePublicFileToTrash } from '@/lib/media-storage';
import { addTrashedMedia } from '@/lib/media-trash-store';
import { replaceExistingMediaFile, uploadFileToStore } from '@/lib/supabase-media';

export const dynamic = 'force-dynamic';

type EditBody = {
  id?: string;
  url?: string;
  width?: number;
  height?: number;
  format?: ImageEditFormat;
  replace?: boolean;
  fileName?: string;
  title?: string;
  alt_text?: string;
  caption?: string;
  description?: string;
};

function trashedIdFor(recordId: string, trashUrl: string): string {
  return `trash_${recordId}_${path.basename(trashUrl)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EditBody;
    const sourceUrl = String(body.url || '').trim();
    const id = String(body.id || '').trim();
    const width = Number(body.width);
    const height = Number(body.height);
    const format = (body.format || 'original') as ImageEditFormat;
    const replace = Boolean(body.replace);
    const fileName = String(body.fileName || body.title || 'imagem').trim() || 'imagem';

    if (!sourceUrl || !id) {
      return NextResponse.json({ success: false, error: 'ID ou URL em falta' }, { status: 400 });
    }
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
      return NextResponse.json({ success: false, error: 'Dimensões inválidas' }, { status: 400 });
    }

    const { buffer: sourceBuffer, mimeType: sourceMime } = await fetchMediaBuffer(sourceUrl);
    const processed = await resizeImageBuffer(
      sourceBuffer,
      width,
      height,
      format,
      sourceMime,
      fileName,
    );

    const catalog = await buildAdminMediaCatalog();
    const existing =
      catalog.find((m) => (id && m.id === id) || (sourceUrl && m.url === sourceUrl)) ?? null;

    let record;

    if (replace) {
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Item não encontrado.' }, { status: 404 });
      }
      if (isLocalMediaPath(existing.url)) {
        const moved = await movePublicFileToTrash(existing.url);
        if (moved) {
          await addTrashedMedia({
            id: trashedIdFor(existing.id, moved.trashUrl),
            url: existing.url,
            trash_path: moved.trashUrl,
            title: existing.title,
            mime_type: existing.mime_type,
            size: existing.size,
            subcategory: existing.subcategory,
            category: existing.category,
            source: existing.source,
            deleted_at: new Date().toISOString(),
          });
        }
      }
      record = await replaceExistingMediaFile(
        existing,
        processed.buffer,
        processed.mimeType,
        body.title?.trim() || fileName,
      );
    } else {
      const base = path.basename(fileName, path.extname(fileName)) || 'imagem';
      const uploadName = `${base}_edited_${Date.now()}${path.extname(processed.name) || '.jpg'}`;
      record = await uploadFileToStore(
        processed.buffer,
        uploadName,
        processed.mimeType,
        'imagens',
        existing?.subcategory || 'Galeria',
      );
      if (body.title?.trim()) {
        record = { ...record, title: body.title.trim() };
      }
    }

    const metadataPayload = {
      title: body.title?.trim() || record.title,
      alt_text: typeof body.alt_text === 'string' ? body.alt_text : existing?.alt_text,
      caption: typeof body.caption === 'string' ? body.caption : existing?.caption,
      description: typeof body.description === 'string' ? body.description : existing?.description,
    };

    await saveMediaMetadata(record.id, record.url, metadataPayload);
    record = { ...record, ...metadataPayload };

    invalidateGalleryCatalogCache();

    return NextResponse.json({ success: true, media: record });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro ao processar imagem';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
