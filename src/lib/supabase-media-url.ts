import { isSupabaseStorageUrl } from '@/lib/media-catalog-key';
import { rewriteSupabaseStorageUrl } from '@/lib/supabase-asset-url';
import { supabasePublicUrlFromStoragePath } from '@/lib/resolve-media-url';
import type { SiteMediaRecord } from '@/lib/site-media';

/** URL pública canónica — sempre derivada do Supabase configurado + storage_path. */
export function canonicalSupabaseMediaUrl(
  record: Pick<SiteMediaRecord, 'url' | 'storage_path'>,
): string | null {
  const storagePath = record.storage_path?.trim();
  if (storagePath) {
    return supabasePublicUrlFromStoragePath(storagePath);
  }

  const url = record.url?.trim();
  if (url && isSupabaseStorageUrl(url)) {
    return rewriteSupabaseStorageUrl(url);
  }

  return null;
}

/** Normaliza registos para exibição — fonte única Supabase, sem ficheiros locais. */
export function normalizeSupabaseMediaRecords<T extends SiteMediaRecord>(records: T[]): T[] {
  const out: T[] = [];

  for (const record of records) {
    const url = canonicalSupabaseMediaUrl(record);
    if (!url) continue;
    out.push({ ...record, url });
  }

  return out;
}
