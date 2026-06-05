import { listDocuments } from '@/lib/aamihe-documents-store';
import type { SiteMediaRecord } from '@/lib/site-media';
import { inferMediaCategory, inferMediaCategoryFromUrl } from '@/lib/site-media';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import { mediaCatalogKey } from '@/lib/media-catalog-key';
import { dedupeMediaByCatalogKey, type MediaRecordWithStorage } from '@/lib/resolve-media-url';
import { normalizeSupabaseMediaRecords } from '@/lib/supabase-media-url';
import {
  getSupabaseMediaById,
  listSupabaseMedia,
  upsertSupabaseMedia,
} from '@/lib/supabase-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { randomUUID } from 'node:crypto';

function documentMediaRecords(documents: SiteDocumentRecord[]): SiteMediaRecord[] {
  return documents
    .filter((doc) => doc.category === 'geral' && doc.published)
    .map((doc) => ({
      id: `doc_media_${doc.id}`,
      site_slug: doc.site_slug,
      title: doc.title_pt,
      url: doc.file_url,
      category: 'documentos' as const,
      subcategory: 'Documentos gerais',
      mime_type: 'application/pdf',
      source: 'document' as const,
      source_id: doc.id,
      published: true,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    }));
}

/** Biblioteca admin — fonte: Supabase `site_media`. */
export async function buildAdminMediaCatalog(): Promise<SiteMediaRecord[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase é obrigatório para a biblioteca multimédia.');
  }

  const items = (await listSupabaseMedia({ all: true })) as MediaRecordWithStorage[];
  return finalizeAdminCatalog(items);
}

/** Galeria pública: Supabase (imagens/vídeos) + PDFs gerais publicados. */
export async function buildMediaCatalog(): Promise<SiteMediaRecord[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase é obrigatório para a galeria multimédia.');
  }

  const items: SiteMediaRecord[] = [...(await listSupabaseMedia())];

  try {
    const publishedGeral = await listDocuments({ category: 'geral', published: true });
    for (const item of documentMediaRecords(publishedGeral)) {
      items.push(item);
    }
  } catch (err) {
    console.warn('Published documents for gallery skipped:', err);
  }

  return finalizeCatalog(items);
}

function finalizeAdminCatalog(items: MediaRecordWithStorage[]): SiteMediaRecord[] {
  const normalized = normalizeSupabaseMediaRecords(items);
  const deduped = dedupeMediaByCatalogKey(normalized);
  return sortMediaCatalog(deduped);
}

function finalizeCatalog(items: SiteMediaRecord[]): SiteMediaRecord[] {
  const normalized = normalizeSupabaseMediaRecords(items);
  return sortMediaCatalog(dedupeMediaByCatalogKey(normalized as MediaRecordWithStorage[]));
}

function sortMediaCatalog(items: SiteMediaRecord[]): SiteMediaRecord[] {
  return items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function upsertMediaRecord(
  input: Omit<SiteMediaRecord, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    storage_path?: string | null;
    catalog_key?: string;
  },
): Promise<SiteMediaRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase é obrigatório para guardar multimédia.');
  }

  const now = new Date().toISOString();
  const record: SiteMediaRecord = {
    id: input.id ?? `media_${Date.now()}_${randomUUID().slice(0, 6)}`,
    site_slug: input.site_slug,
    title: input.title,
    url: input.url,
    category: input.category ?? inferMediaCategory(input.mime_type),
    subcategory: input.subcategory ?? 'Upload',
    mime_type: input.mime_type,
    size: input.size,
    source: input.source,
    source_id: input.source_id,
    published: input.published ?? true,
    created_at: now,
    updated_at: now,
    alt_text: input.alt_text,
    caption: input.caption,
    description: input.description,
  };

  const saved = await upsertSupabaseMedia({
    ...record,
    storage_path: input.storage_path ?? null,
    catalog_key: input.catalog_key ?? mediaCatalogKey(record.url),
  });

  if (!saved) {
    throw new Error('Não foi possível guardar o registo multimédia.');
  }

  return saved;
}

export async function findMediaRecordById(id: string): Promise<SiteMediaRecord | null> {
  if (isSupabaseConfigured()) {
    const fromDb = await getSupabaseMediaById(id);
    if (fromDb) return fromDb;
  }

  return null;
}

export function categoryFromFile(file: { mimetype?: string; name: string }): 'imagens' | 'videos' | 'documentos' {
  if (file.mimetype) return inferMediaCategory(file.mimetype);
  return inferMediaCategoryFromUrl(file.name);
}
