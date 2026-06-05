import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { uploadLocalFileToSupabase } from '@/lib/media-local-upload';
import { canonicalSupabaseMediaUrl } from '@/lib/supabase-media-url';
import { deleteSupabaseMedia, upsertSupabaseMedia } from '@/lib/supabase-media';
import { getSupabaseAdmin, isSupabaseConfigured, MEDIA_BUCKET, rowToMediaRecord } from '@/lib/supabase/server';
import type { SupabaseMediaRow } from '@/lib/supabase/server';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

async function listAllStoragePaths(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<Set<string>> {
  const paths = new Set<string>();

  async function walk(prefix: string) {
    const { data } = await admin.storage.from(MEDIA_BUCKET).list(prefix, { limit: 1000 });
    for (const entry of data || []) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) paths.add(rel);
      else await walk(rel);
    }
  }

  await walk('');
  return paths;
}

/** Todas as imagens em public/gallery (inclui subpastas paises/, flags/, etc.). */
async function walkGalleryImages(): Promise<{ absolute: string; rel: string }[]> {
  const files: { absolute: string; rel: string }[] = [];
  const galleryRoot = path.join(process.cwd(), 'public', 'gallery');

  async function walk(dir: string, prefix: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      files.push({ absolute: full, rel: `gallery/${rel}`.replace(/\\/g, '/') });
    }
  }

  await walk(galleryRoot, '');
  return files;
}

export type SyncSupabaseMediaResult = {
  localFiles: number;
  uploaded: number;
  uploadFailed: number;
  prunedOrphans: number;
  catalogAfter: number;
};

/** Importa cada ficheiro de public/gallery para Supabase Storage + site_media. */
export async function syncSupabaseMediaFromDisk(): Promise<SyncSupabaseMediaResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase é obrigatório.');
  }

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado.');

  const localFiles = await walkGalleryImages();
  const localStoragePaths = new Set(
    localFiles.map((f) => {
      const normalized = f.rel.replace(/\\/g, '/');
      return normalized.startsWith('legacy/') ? normalized : `legacy/${normalized}`;
    }),
  );

  let uploaded = 0;
  let uploadFailed = 0;

  for (const file of localFiles) {
    try {
      const saved = await uploadLocalFileToSupabase(file.absolute, file.rel);
      if (saved) uploaded += 1;
      else uploadFailed += 1;
    } catch {
      uploadFailed += 1;
    }
  }

  const { data: rows, error } = await admin.from('site_media').select('*').eq('category', 'imagens');
  if (error) throw new Error(error.message);

  const storagePaths = await listAllStoragePaths(admin);
  let prunedOrphans = 0;

  for (const row of (rows || []) as SupabaseMediaRow[]) {
    const storagePath = row.storage_path?.trim();
    const existsInStorage = storagePath ? storagePaths.has(storagePath) : false;
    const existsInGalleryImport = storagePath ? localStoragePaths.has(storagePath) : false;

    if (!existsInStorage && !existsInGalleryImport) {
      await deleteSupabaseMedia(row.id);
      prunedOrphans += 1;
      continue;
    }

    const record = rowToMediaRecord(row);
    const url = canonicalSupabaseMediaUrl(record);
    if (url && url !== record.url) {
      await upsertSupabaseMedia({ ...record, url });
    }
  }

  const { count } = await admin
    .from('site_media')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'imagens')
    .eq('published', true);

  return {
    localFiles: localFiles.length,
    uploaded,
    uploadFailed,
    prunedOrphans,
    catalogAfter: count ?? 0,
  };
}
