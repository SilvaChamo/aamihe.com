import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SiteMediaRecord } from '@/lib/site-media';

export const MEDIA_BUCKET = 'aamihe-media';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type SupabaseMediaRow = {
  id: string;
  site_slug: string;
  title: string;
  url: string;
  category: string;
  subcategory: string;
  mime_type: string;
  size: number | null;
  source: string;
  source_id: string | null;
  published: boolean;
  catalog_key: string;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToMediaRecord(row: SupabaseMediaRow): SiteMediaRecord {
  return {
    id: row.id,
    site_slug: row.site_slug,
    title: row.title,
    url: row.url,
    category: row.category as SiteMediaRecord['category'],
    subcategory: row.subcategory,
    mime_type: row.mime_type,
    size: row.size ?? undefined,
    source: row.source as SiteMediaRecord['source'],
    source_id: row.source_id ?? undefined,
    published: row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
