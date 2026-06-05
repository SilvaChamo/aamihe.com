import { readdir } from 'node:fs/promises';
import path from 'node:path';
import {
  mediaCatalogKey,
  mediaQualityScore,
  mediaUniqueBasename,
} from '@/lib/media-catalog-key';
import {
  localPathFromUrl,
  sanitizeStorageRel,
  stableMediaId,
  uploadLocalFileToSupabase,
} from '@/lib/media-local-upload';
import {
  resolveMediaDisplayUrl,
  storageFileExists,
  supabasePublicUrlFromStoragePath,
  type MediaRecordWithStorage,
} from '@/lib/resolve-media-url';
import { deleteSupabaseMedia, upsertSupabaseMedia } from '@/lib/supabase-media';
import { storagePathFromMediaUrl } from '@/lib/supabase-media';
import { getSupabaseAdmin, isSupabaseConfigured, rowToMediaRecord } from '@/lib/supabase/server';
import type { SiteMediaRecord } from '@/lib/site-media';
import type { SupabaseMediaRow } from '@/lib/supabase/server';
import { publicFileExists } from '@/lib/reference-image-sync';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP = /(?:^|\/)(pt_PT|fr_FR|en_GB)\.png$|Logo-Small|cropped-Logo|favicon/i;

async function walkPublicImages(): Promise<Map<string, { absolute: string; rel: string }>> {
  const byKey = new Map<string, { absolute: string; rel: string }>();
  const publicRoot = path.join(process.cwd(), 'public');

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
      if (!IMAGE_EXT.has(ext) || SKIP.test(rel)) continue;
      const key = mediaUniqueBasename(`/${rel.replace(/\\/g, '/')}`);
      if (!key) continue;
      const existing = byKey.get(key);
      const stub = (relPath: string): SiteMediaRecord =>
        ({ id: 'site_local', url: `/${relPath}` }) as SiteMediaRecord;
      const score = mediaQualityScore(stub(rel));
      const prevScore = existing ? mediaQualityScore(stub(existing.rel)) : -1;
      if (!existing || score > prevScore) {
        byKey.set(key, { absolute: full, rel });
      }
    }
  }

  await walk(publicRoot, '');
  return byKey;
}

/** Uma chave por ficheiro — basename normalizado (local e Supabase). */
function imageGroupKey(url: string, catalogKey?: string | null): string {
  const fromUrl = mediaUniqueBasename(url);
  if (fromUrl) return fromUrl;
  const stored = catalogKey?.trim().toLowerCase();
  if (stored && !stored.startsWith('/storage/')) return stored;
  return mediaCatalogKey(url).toLowerCase();
}

function catalogKeyForRow(row: SupabaseMediaRow): string {
  return imageGroupKey(row.url, row.catalog_key);
}

async function keeperFromExisting(candidates: SupabaseMediaRow[]): Promise<SiteMediaRecord | null> {
  const sorted = [...candidates].sort(
    (a, b) => mediaQualityScore(rowToMediaRecord(b)) - mediaQualityScore(rowToMediaRecord(a)),
  );

  for (const candidate of sorted) {
    const storagePath = candidate.storage_path?.trim();
    if (storagePath && (await storageFileExists(storagePath))) {
      const url = supabasePublicUrlFromStoragePath(storagePath);
      if (!url) continue;
      return {
        ...rowToMediaRecord(candidate),
        id: stableMediaId(imageGroupKey(candidate.url, candidate.catalog_key)),
        url,
        storage_path: storagePath,
        catalog_key: imageGroupKey(candidate.url, candidate.catalog_key),
      };
    }

    const fromUrl = storagePathFromMediaUrl(candidate.url);
    if (fromUrl && (await storageFileExists(fromUrl))) {
      const url = supabasePublicUrlFromStoragePath(fromUrl);
      if (!url) continue;
      return {
        ...rowToMediaRecord(candidate),
        id: stableMediaId(imageGroupKey(candidate.url, candidate.catalog_key)),
        url,
        storage_path: fromUrl,
        catalog_key: imageGroupKey(candidate.url, candidate.catalog_key),
      };
    }
  }

  const best = sorted[0];
  if (!best) return null;

  const local = localPathFromUrl(best.url);
  if (local && (await publicFileExists(best.url))) {
    const uploaded = await uploadLocalFileToSupabase(local.absolute, local.rel);
    if (uploaded) return uploaded;
  }

  const display = await resolveMediaDisplayUrl(rowToMediaRecord(best) as MediaRecordWithStorage);
  if (display?.startsWith('http')) {
    const storage_path =
      best.storage_path?.trim() ||
      storagePathFromMediaUrl(display) ||
      sanitizeStorageRel(mediaUniqueBasename(display));
    return {
      ...rowToMediaRecord(best),
      id: stableMediaId(imageGroupKey(best.url, best.catalog_key)),
      url: display,
      storage_path,
      catalog_key: imageGroupKey(best.url, best.catalog_key),
    };
  }

  return null;
}

export type MediaCatalogCleanupResult = {
  supabaseBefore: number;
  supabaseAfter: number;
  deletedFromSupabase: number;
  localFilesIndexed: number;
  uploadedToStorage: number;
  dryRun: boolean;
};

/**
 * Uma imagem = uma entrada em site_media com URL do Supabase Storage.
 * Remove duplicados, órfãos e URLs locais/antigas sem ficheiro.
 */
export async function cleanupMediaCatalog(options?: {
  dryRun?: boolean;
}): Promise<MediaCatalogCleanupResult> {
  const dryRun = options?.dryRun ?? false;
  const localByKey = await walkPublicImages();

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase é obrigatório para limpeza do catálogo multimédia.');
  }

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado.');

  const { data: rows, error } = await admin.from('site_media').select('*');
  if (error) throw new Error(error.message);

  const allRows = (rows || []) as SupabaseMediaRow[];
  const supabaseBefore = allRows.length;

  const imageRows = allRows.filter((r) => r.category === 'imagens');
  const otherRows = allRows.filter((r) => r.category !== 'imagens');

  const rowsByKey = new Map<string, SupabaseMediaRow[]>();
  for (const row of imageRows) {
    const key = catalogKeyForRow(row);
    if (!key) continue;
    const list = rowsByKey.get(key) || [];
    list.push(row);
    rowsByKey.set(key, list);
  }

  const keepers: SiteMediaRecord[] = [];
  let uploadedToStorage = 0;

  const allKeys = new Set<string>([...localByKey.keys(), ...rowsByKey.keys()]);

  for (const key of allKeys) {
    const local = localByKey.get(key);
    const candidates = rowsByKey.get(key) || [];

    let keeper: SiteMediaRecord | null = null;

    if (candidates.length > 0) {
      keeper = await keeperFromExisting(candidates);
    }

    if (!keeper && local) {
      const uploaded = await uploadLocalFileToSupabase(local.absolute, local.rel);
      if (uploaded) {
        keeper = uploaded;
        uploadedToStorage += 1;
      }
    }

    if (keeper) keepers.push(keeper);

    rowsByKey.delete(key);
  }

  const otherByUrl = new Map<string, SupabaseMediaRow>();
  for (const row of otherRows) {
    const k = row.url.trim().toLowerCase();
    if (!otherByUrl.has(k)) otherByUrl.set(k, row);
  }
  for (const row of otherByUrl.values()) {
    keepers.push(rowToMediaRecord(row));
  }

  const keepIds = new Set(keepers.map((k) => k.id));
  const deleteIds = allRows.map((r) => r.id).filter((id) => !keepIds.has(id));

  if (!dryRun) {
    for (const id of deleteIds) {
      await deleteSupabaseMedia(id);
    }

    for (const record of keepers) {
      await upsertSupabaseMedia({
        ...record,
        catalog_key: record.catalog_key ?? imageGroupKey(record.url, record.catalog_key),
        storage_path: record.storage_path ?? storagePathFromMediaUrl(record.url),
      });
    }
  }

  return {
    supabaseBefore,
    supabaseAfter: keepers.length,
    deletedFromSupabase: deleteIds.length,
    localFilesIndexed: localByKey.size,
    uploadedToStorage,
    dryRun,
  };
}
