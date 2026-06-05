import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { SiteMediaRecord } from '@/lib/site-media';
import { upsertSupabaseMedia } from '@/lib/supabase-media';
import { getSupabaseAdmin, isSupabaseConfigured, MEDIA_BUCKET } from '@/lib/supabase/server';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function mimeFromExt(ext: string) {
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

export function stableMediaId(catalogKey: string) {
  return `media_${createHash('sha1').update(catalogKey).digest('hex').slice(0, 12)}`;
}

export function sanitizeStorageRel(relPath: string) {
  const normalized = relPath
    .replace(/\\/g, '/')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w./-]+/g, '-')
    .replace(/-+/g, '-');
  return normalized.startsWith('legacy/') ? normalized : `legacy/${normalized}`;
}

function titleFromName(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function subcategoryFor(relPath: string, filename: string) {
  if (relPath.includes('gallery/paises/')) return 'Países membros';
  if (relPath.startsWith('gallery/')) {
    return filename.startsWith('news-') ? 'Notícias' : 'Galeria';
  }
  if (relPath.startsWith('uploads/imagens/')) return 'Notícias';
  if (relPath.startsWith('images/paises/')) return 'Países membros';
  if (relPath.startsWith('images/')) return 'Site';
  return 'Galeria';
}

/** Envia um ficheiro local para o bucket Supabase e regista em site_media. */
export async function uploadLocalFileToSupabase(
  absolutePath: string,
  relPath: string,
): Promise<SiteMediaRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const ext = path.extname(absolutePath).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return null;

  const buffer = await readFile(absolutePath);
  const mimeType = mimeFromExt(ext);
  const storagePathFinal = sanitizeStorageRel(relPath);
  const subcategory = subcategoryFor(relPath, path.basename(absolutePath));

  const { error: uploadError } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(storagePathFinal, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.error('Storage upload', relPath, uploadError.message);
    return null;
  }

  const { data: publicData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePathFinal);
  const id = stableMediaId(storagePathFinal);
  const catalog_key = storagePathFinal.toLowerCase();
  const record: SiteMediaRecord = {
    id,
    site_slug: 'aamihe',
    title: titleFromName(path.basename(absolutePath)),
    url: publicData.publicUrl,
    category: 'imagens',
    subcategory,
    mime_type: mimeType,
    size: buffer.length,
    source: 'upload',
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    catalog_key,
    storage_path: storagePathFinal,
  };

  return upsertSupabaseMedia({
    ...record,
    storage_path: storagePathFinal,
    catalog_key: record.catalog_key,
  });
}

/** Caminho absoluto + relativo a partir de URL local (/gallery/...). */
export function localPathFromUrl(url: string): { absolute: string; rel: string } | null {
  if (!url.startsWith('/')) return null;
  const rel = url.replace(/^\//, '');
  return {
    absolute: path.join(process.cwd(), 'public', rel),
    rel,
  };
}
