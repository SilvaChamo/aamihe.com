import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MediaCategory } from '@/lib/site-media';
import type { SiteMediaRecord } from '@/lib/site-media';
import { mediaCatalogKey } from '@/lib/media-catalog-key';
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  MEDIA_BUCKET,
  rowToMediaRecord,
  type SupabaseMediaRow,
} from '@/lib/supabase/server';
import { storeImageBuffer, storeUploadBuffer } from '@/lib/media-storage';

function storagePathForFile(originalName: string, subcategory: string): string {
  const ext = path.extname(originalName) || '.jpg';
  const prefix = subcategory === 'Notícias' ? 'news' : 'uploads';
  return `${prefix}/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

export async function listSupabaseMedia(): Promise<SiteMediaRecord[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data, error } = await admin
    .from('site_media')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase list media:', error.message);
    return [];
  }

  return (data as SupabaseMediaRow[]).map(rowToMediaRecord);
}

export async function upsertSupabaseMedia(
  record: Omit<SiteMediaRecord, 'created_at' | 'updated_at'> & {
    storage_path?: string | null;
    catalog_key?: string;
  }
): Promise<SiteMediaRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const now = new Date().toISOString();
  const row = {
    id: record.id,
    site_slug: record.site_slug,
    title: record.title,
    url: record.url,
    category: record.category,
    subcategory: record.subcategory,
    mime_type: record.mime_type,
    size: record.size ?? null,
    source: record.source,
    source_id: record.source_id ?? null,
    published: record.published,
    catalog_key: record.catalog_key ?? mediaCatalogKey(record.url),
    storage_path: record.storage_path ?? null,
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await admin.from('site_media').upsert(row, { onConflict: 'id' }).select().single();

  if (error) {
    console.error('Supabase upsert media:', error.message);
    return null;
  }

  return rowToMediaRecord(data as SupabaseMediaRow);
}

export async function deleteSupabaseMedia(id: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const { data: row } = await admin.from('site_media').select('storage_path').eq('id', id).maybeSingle();

  const { error } = await admin.from('site_media').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete media row:', error.message);
    return false;
  }

  if (row?.storage_path) {
    await admin.storage.from(MEDIA_BUCKET).remove([row.storage_path]);
  }

  return true;
}

export async function uploadFileToStore(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  category: MediaCategory,
  subcategory: string
): Promise<SiteMediaRecord> {
  const admin = getSupabaseAdmin();
  const source = subcategory === 'Notícias' ? 'news' : 'upload';
  const id = `media_${Date.now()}_${randomUUID().slice(0, 6)}`;

  if (admin && isSupabaseConfigured()) {
    const storagePath = storagePathForFile(originalName, subcategory);
    const { error: uploadError } = await admin.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (!uploadError) {
      const { data: publicData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
      const record: SiteMediaRecord = {
        id,
        site_slug: 'aamihe',
        title: originalName,
        url: publicData.publicUrl,
        category,
        subcategory,
        mime_type: mimeType,
        size: buffer.length,
        source,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const saved = await upsertSupabaseMedia({ ...record, storage_path: storagePath });
      if (saved) return saved;
    } else {
      console.error('Supabase storage upload:', uploadError.message);
    }
  }

  const saved =
    category === 'imagens' && subcategory === 'Notícias'
      ? await storeImageBuffer(buffer, originalName, mimeType)
      : await storeUploadBuffer(buffer, originalName, category === 'videos' ? 'uploads/videos' : category === 'documentos' ? 'uploads/documentos' : 'uploads/imagens', mimeType);

  const record: SiteMediaRecord = {
    id,
    site_slug: 'aamihe',
    title: originalName,
    url: saved.url,
    category,
    subcategory,
    mime_type: mimeType,
    size: buffer.length,
    source,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const synced = await upsertSupabaseMedia(record);
    if (synced) return synced;
  }

  return record;
}
