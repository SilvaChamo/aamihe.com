import type { DashboardDb } from '@/lib/dashboard-db';
import type { SiteMediaRecord } from '@/lib/site-media';
import { inferMediaCategory, inferMediaCategoryFromUrl } from '@/lib/site-media';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import { collectAllSiteImages } from '@/lib/collect-site-images';
import { dedupeMediaRecords } from '@/lib/media-catalog-key';
import {
  repairDuplicateIds,
  resolveMediaRecordFiles,
  uniqueMediaIds,
} from '@/lib/reference-image-sync';
import { listSupabaseMedia } from '@/lib/supabase-media';
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

/** Biblioteca admin: Supabase + uploads locais, sem duplicar ficheiros legados. */
export async function buildAdminMediaCatalog(db: DashboardDb): Promise<SiteMediaRecord[]> {
  const items: SiteMediaRecord[] = [];

  if (isSupabaseConfigured()) {
    items.push(...(await listSupabaseMedia()));
  }

  for (const item of db.media.filter((m) => m.published)) {
    items.push(item);
  }

  return finalizeCatalog(items);
}

/** Galeria pública: inclui legado WordPress com deduplicação. */
export async function buildMediaCatalog(db: DashboardDb): Promise<SiteMediaRecord[]> {
  const items: SiteMediaRecord[] = [];

  if (isSupabaseConfigured()) {
    items.push(...(await listSupabaseMedia()));
  }

  for (const item of db.media.filter((m) => m.published)) {
    items.push(item);
  }

  for (const item of await collectAllSiteImages()) {
    items.push(item);
  }

  for (const item of documentMediaRecords(db.documents)) {
    items.push(item);
  }

  return finalizeCatalog(items);
}

async function finalizeCatalog(items: SiteMediaRecord[]): Promise<SiteMediaRecord[]> {
  const deduped = dedupeMediaRecords(repairDuplicateIds(uniqueMediaIds(items)));
  const resolved = await resolveMediaRecordFiles(deduped);
  return sortMediaCatalog(dedupeMediaRecords(resolved));
}

function sortMediaCatalog(items: SiteMediaRecord[]): SiteMediaRecord[] {
  return items.sort((a, b) => {
    const newsRank = (item: SiteMediaRecord) =>
      item.source === 'news' || item.subcategory === 'Notícias' ? 0 : 1;
    const rankDiff = newsRank(a) - newsRank(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function upsertMediaRecord(
  db: DashboardDb,
  input: Omit<SiteMediaRecord, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): SiteMediaRecord {
  const now = new Date().toISOString();
  const existing = db.media.find((m) => m.url === input.url);
  if (existing) {
    Object.assign(existing, input, { updated_at: now });
    return existing;
  }

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
  };

  db.media.push(record);
  return record;
}

export function categoryFromFile(file: { mimetype?: string; name: string }): 'imagens' | 'videos' | 'documentos' {
  if (file.mimetype) return inferMediaCategory(file.mimetype);
  return inferMediaCategoryFromUrl(file.name);
}
