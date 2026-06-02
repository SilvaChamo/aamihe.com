import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  dedupeMediaRecords,
  mediaCatalogKey,
  mediaUniqueBasename,
  mediaQualityScore,
} from '@/lib/media-catalog-key';
import { deleteSupabaseMedia, upsertSupabaseMedia } from '@/lib/supabase-media';
import { getSupabaseAdmin, isSupabaseConfigured, rowToMediaRecord } from '@/lib/supabase/server';
import type { SiteMediaRecord } from '@/lib/site-media';
import type { SupabaseMediaRow } from '@/lib/supabase/server';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function stableMediaId(basename: string): string {
  return `media_${createHash('sha1').update(basename).digest('hex').slice(0, 12)}`;
}

async function walkPublicSubdir(publicSubdir: string): Promise<Map<string, string>> {
  const byBasename = new Map<string, string>();
  const absoluteDir = path.join(process.cwd(), 'public', publicSubdir);
  const urlBase = `/${publicSubdir.replace(/\\/g, '/')}`;

  async function walk(currentDir: string, relInside: string) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const rel = relInside ? `${relInside}/${entry.name}` : entry.name;
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      const url = `${urlBase}/${rel}`.replace(/\/+/g, '/');
      const key = mediaUniqueBasename(url);
      if (!key) continue;
      byBasename.set(key, url);
    }
  }

  await walk(absoluteDir, '');
  return byBasename;
}

export async function indexLocalMediaUrls(): Promise<Map<string, string>> {
  const gallery = await walkPublicSubdir('gallery');
  const uploads = await walkPublicSubdir('uploads/imagens');
  const merged = new Map<string, string>(uploads);
  for (const [key, url] of gallery) merged.set(key, url);
  return merged;
}

function titleFromUrl(url: string): string {
  return path
    .basename(url)
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

function buildKeeper(
  basename: string,
  localUrl: string | undefined,
  candidates: SiteMediaRecord[],
): SiteMediaRecord {
  const url = localUrl ?? candidates[0]?.url ?? '';
  const best = [...candidates].sort((a, b) => mediaQualityScore(b) - mediaQualityScore(a))[0];
  const subcategory = localUrl?.startsWith('/uploads/')
    ? 'Notícias'
    : localUrl?.startsWith('/gallery/')
      ? localUrl.includes('news-')
        ? 'Notícias'
        : 'Galeria'
      : best?.subcategory || 'Galeria';

  return {
    id: stableMediaId(basename),
    site_slug: 'aamihe',
    title: best?.title || titleFromUrl(url),
    url,
    category: 'imagens',
    subcategory,
    mime_type: best?.mime_type || 'image/jpeg',
    size: best?.size,
    source: best?.source === 'news' ? 'news' : 'upload',
    published: true,
    created_at: best?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export type MediaCatalogCleanupResult = {
  supabaseBefore: number;
  supabaseAfter: number;
  deletedFromSupabase: number;
  localFilesIndexed: number;
  dryRun: boolean;
};

export async function cleanupMediaCatalog(options?: {
  dryRun?: boolean;
}): Promise<MediaCatalogCleanupResult> {
  const dryRun = options?.dryRun ?? false;
  const localByBasename = await indexLocalMediaUrls();

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase é obrigatório para limpeza do catálogo multimédia.');
  }

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado.');

  const { data: rows, error } = await admin.from('site_media').select('*');
  if (error) throw new Error(error.message);

  const allRows = (rows || []) as SupabaseMediaRow[];
  const supabaseBefore = allRows.length;

  const byBasename = new Map<string, SiteMediaRecord[]>();
  for (const row of allRows) {
    const record = rowToMediaRecord(row);
    const key = mediaUniqueBasename(record.url);
    if (!key) continue;
    const list = byBasename.get(key) || [];
    list.push(record);
    byBasename.set(key, list);
  }

  const keepers: SiteMediaRecord[] = [];
  const keeperIds = new Set<string>();

  for (const [basename, localUrl] of localByBasename) {
    const candidates = byBasename.get(basename) || [];
    const keeper = buildKeeper(basename, localUrl, candidates);
    keepers.push(keeper);
    keeperIds.add(keeper.id);
    byBasename.delete(basename);
  }

  for (const [basename, candidates] of byBasename) {
    const cloudOnly = candidates.filter((c) => c.url.includes('supabase'));
    if (cloudOnly.length === 0) continue;
    const keeper = buildKeeper(basename, undefined, cloudOnly);
    keepers.push(keeper);
    keeperIds.add(keeper.id);
  }

  const finalKeepers = dedupeMediaRecords(keepers);
  const deleteIds = allRows.map((r) => r.id).filter((id) => !keeperIds.has(id));

  if (!dryRun) {
    for (const id of deleteIds) {
      await deleteSupabaseMedia(id);
    }

    for (const record of finalKeepers) {
      const row = allRows.find((r) => r.id === record.id);
      await upsertSupabaseMedia({
        ...record,
        catalog_key: mediaCatalogKey(record.url),
        storage_path: row?.storage_path ?? null,
      });
    }
  }

  return {
    supabaseBefore,
    supabaseAfter: finalKeepers.length,
    deletedFromSupabase: deleteIds.length,
    localFilesIndexed: localByBasename.size,
    dryRun,
  };
}
