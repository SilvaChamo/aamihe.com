import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { collectGalleryImages } from '@/lib/local-gallery-catalog';
import { findBestGalleryUrl, galleryFileStem } from '@/lib/gallery-match';
import { mediaCatalogKey } from '@/lib/media-catalog-key';
import { deleteSupabaseMedia, upsertSupabaseMedia } from '@/lib/supabase-media';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import type { SiteMediaRecord } from '@/lib/site-media';

export type SyncGalleryMetadataResult = {
  galleryFiles: number;
  upserted: number;
  pruned: number;
  aliases: number;
  referencesFixed: string[];
};

const SITE_IMAGE_REF_FILES = [
  'src/data/noticias/catalog.json',
  'src/data/board-members.ts',
  'src/components/DirectionSection.tsx',
  'src/data/paisesCarousel.ts',
  'src/data/conferencia-content.ts',
  'src/data/site-search-index.ts',
];

/** Caminhos sem ficheiro na galeria → substituto existente. */
const KNOWN_IMAGE_FALLBACKS: Record<string, string> = {
  '/gallery/Ocean-acidification-training.jpeg.webp': '/gallery/Image-5-1-300x209.jpeg',
  '/gallery/envento-768x432-1.jpg': '/gallery/image-3-1.jpg',
};

const IMAGE_PATH_RE = /\/(?:gallery|images|Imagens)\/[^"'`\s]+/gi;

/** Sincroniza site_media no Supabase com public/gallery (URLs locais, sem Storage). */
export async function syncGalleryMetadataToSupabase(): Promise<SyncGalleryMetadataResult> {
  const records = await collectGalleryImages();
  const urls = records.map((r) => r.url);

  await writeFile(
    path.join(process.cwd(), 'src/data/gallery-urls.json'),
    `${JSON.stringify(urls, null, 2)}\n`,
    'utf8',
  );

  let upserted = 0;
  let pruned = 0;

  if (isSupabaseConfigured()) {
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase não configurado.');

    const urlSet = new Set(urls.map((u) => u.toLowerCase()));
    const stemSet = new Set(urls.map((u) => galleryFileStem(u)));

    for (const record of records) {
      const saved = await upsertSupabaseMedia({
        ...record,
        storage_path: null,
        catalog_key: record.catalog_key ?? mediaCatalogKey(record.url),
      });
      if (saved) upserted += 1;
    }

    const { data: rows, error } = await admin.from('site_media').select('id, url, category').eq('category', 'imagens');
    if (error) throw new Error(error.message);

    for (const row of rows || []) {
      const url = String(row.url || '');
      const stem = galleryFileStem(url);
      const keep =
        url.startsWith('/gallery/') &&
        (urlSet.has(url.toLowerCase()) || stemSet.has(stem));
      if (!keep) {
        await deleteSupabaseMedia(row.id);
        pruned += 1;
      }
    }
  }

  const referencesFixed: string[] = [];
  const aliasEntries: Record<string, string> = {};

  for (const rel of SITE_IMAGE_REF_FILES) {
    const filePath = path.join(process.cwd(), rel);
    let text: string;
    try {
      const { readFile } = await import('node:fs/promises');
      text = await readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    let changed = false;
    const updated = text.replace(IMAGE_PATH_RE, (match) => {
      const known = KNOWN_IMAGE_FALLBACKS[match];
      if (known && urls.includes(known)) {
        aliasEntries[match] = known;
        referencesFixed.push(`${match} → ${known}`);
        changed = true;
        return known;
      }

      const normalized = match.startsWith('/images/')
        ? match.replace(/^\/images\//, '/gallery/')
        : match.startsWith('/Imagens/')
          ? match.replace(/^\/Imagens\//, '/gallery/')
          : match;

      if (urls.includes(normalized)) {
        if (normalized !== match) {
          aliasEntries[match] = normalized;
          referencesFixed.push(`${match} → ${normalized}`);
          changed = true;
          return normalized;
        }
        return match;
      }

      const resolved = findBestGalleryUrl(match, urls);
      if (!resolved || resolved === match) return match;
      aliasEntries[match] = resolved;
      referencesFixed.push(`${match} → ${resolved}`);
      changed = true;
      return resolved;
    });

    if (changed) {
      await writeFile(filePath, updated, 'utf8');
    }
  }

  await writeFile(
    path.join(process.cwd(), 'src/data/gallery-aliases.json'),
    `${JSON.stringify(aliasEntries, null, 2)}\n`,
    'utf8',
  );

  return {
    galleryFiles: records.length,
    upserted,
    pruned,
    aliases: Object.keys(aliasEntries).length,
    referencesFixed,
  };
}
