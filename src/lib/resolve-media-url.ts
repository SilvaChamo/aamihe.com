import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  isLocalMediaPath,
  isSupabaseStorageUrl,
  mediaCatalogKey,
  mediaQualityScore,
  mediaUniqueBasename,
} from '@/lib/media-catalog-key';
import { normalizeAssetUrl } from '@/lib/supabase-asset-url';
import type { SiteMediaRecord } from '@/lib/site-media';
import { getSupabaseAdmin, isSupabaseConfigured, MEDIA_BUCKET } from '@/lib/supabase/server';

export type MediaRecordWithStorage = SiteMediaRecord & {
  storage_path?: string | null;
  catalog_key?: string;
};

/** URL pública do bucket Supabase (Hetzner/cloud) a partir do caminho no storage. */
export function supabasePublicUrlFromStoragePath(storagePath: string): string | null {
  const admin = getSupabaseAdmin();
  if (!admin || !storagePath.trim()) return null;
  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath.trim());
  return data.publicUrl || null;
}

export async function storageFileExists(storagePath: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const folder = path.posix.dirname(storagePath);
  const name = path.posix.basename(storagePath);
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).list(folder === '.' ? '' : folder, {
    search: name,
    limit: 1,
  });
  if (error) return false;
  return (data || []).some((f) => f.name === name);
}

/**
 * Resolve o URL que o browser deve pedir — apenas Supabase (fonte única).
 */
export async function resolveMediaDisplayUrl(record: MediaRecordWithStorage): Promise<string | null> {
  const storagePath = record.storage_path?.trim();
  if (storagePath && isSupabaseConfigured()) {
    return supabasePublicUrlFromStoragePath(storagePath);
  }

  const storedUrl = record.url?.trim();
  if (storedUrl && isSupabaseStorageUrl(storedUrl)) {
    return storedUrl;
  }

  if (storedUrl && isLocalMediaPath(storedUrl)) {
    return normalizeAssetUrl(storedUrl);
  }

  return null;
}

export async function resolveMediaRecordsForDisplay(
  records: MediaRecordWithStorage[],
): Promise<MediaRecordWithStorage[]> {
  const resolved: MediaRecordWithStorage[] = [];

  for (const record of records) {
    const url = await resolveMediaDisplayUrl(record);
    if (!url) continue;
    resolved.push({
      ...record,
      url,
      updated_at: record.updated_at,
    });
  }

  return resolved;
}

/** Uma entrada por imagem (catalog_key); mantém a melhor qualidade e URL que funciona. */
export function dedupeMediaByCatalogKey(items: MediaRecordWithStorage[]): MediaRecordWithStorage[] {
  const byKey = new Map<string, MediaRecordWithStorage>();

  for (const item of items) {
    const key =
      mediaUniqueBasename(item.url) ||
      item.catalog_key?.trim().toLowerCase() ||
      mediaCatalogKey(item.url);
    if (!key) continue;

    const existing = byKey.get(key);
    if (!existing || mediaQualityScore(item) > mediaQualityScore(existing)) {
      byKey.set(key, item);
    }
  }

  return Array.from(byKey.values());
}

export async function readLocalImageBuffer(localPath: string): Promise<Buffer | null> {
  if (!localPath.startsWith('/')) return null;
  try {
    return await readFile(path.join(process.cwd(), 'public', localPath.replace(/^\//, '')));
  } catch {
    return null;
  }
}
