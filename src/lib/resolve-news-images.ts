import type { NewsItem } from '@/data/news';
import { mediaCatalogKey, mediaQualityScore, mediaUniqueBasename } from '@/lib/media-catalog-key';
import { legacyPublicPathToSupabaseUrl, rewriteSupabaseStorageUrl } from '@/lib/supabase-asset-url';
import type { SiteMediaRecord } from '@/lib/site-media';
import { listSupabaseMedia } from '@/lib/supabase-media';
import { canonicalSupabaseMediaUrl } from '@/lib/supabase-media-url';
import { isSupabaseConfigured } from '@/lib/supabase/server';

const NEWS_IMAGE_FALLBACK = legacyPublicPathToSupabaseUrl('/gallery/Logo.webp') || '';

type MediaLookup = {
  byCatalogKey: Map<string, SiteMediaRecord>;
  byBasename: Map<string, SiteMediaRecord>;
};

function remember(map: Map<string, SiteMediaRecord>, key: string, record: SiteMediaRecord) {
  if (!key) return;
  const existing = map.get(key);
  if (!existing || mediaQualityScore(record) > mediaQualityScore(existing)) {
    map.set(key, record);
  }
}

async function buildMediaLookup(): Promise<MediaLookup> {
  const byCatalogKey = new Map<string, SiteMediaRecord>();
  const byBasename = new Map<string, SiteMediaRecord>();

  if (!isSupabaseConfigured()) {
    return { byCatalogKey, byBasename };
  }

  const items = await listSupabaseMedia({ all: true });
  for (const item of items) {
    if (item.category !== 'imagens') continue;
    remember(byCatalogKey, mediaCatalogKey(item.url), item);
    remember(byBasename, mediaUniqueBasename(item.url), item);
    if (item.url.startsWith('/')) {
      remember(byCatalogKey, item.url.toLowerCase(), item);
    }
  }

  return { byCatalogKey, byBasename };
}

function pickFromLookup(lookup: MediaLookup, imagePath: string): SiteMediaRecord | null {
  const catalogKey = mediaCatalogKey(imagePath);
  const basename = mediaUniqueBasename(imagePath);
  return (
    lookup.byCatalogKey.get(catalogKey) ??
    lookup.byCatalogKey.get(imagePath.toLowerCase()) ??
    lookup.byBasename.get(basename) ??
    null
  );
}

function resolveLocalNewsImage(imagePath: string, lookup: MediaLookup): string {
  const fromLibrary = pickFromLookup(lookup, imagePath);
  if (fromLibrary) {
    const displayUrl = canonicalSupabaseMediaUrl(fromLibrary);
    if (displayUrl) return displayUrl;
  }

  const fromPath = legacyPublicPathToSupabaseUrl(imagePath);
  if (fromPath) return fromPath;

  return NEWS_IMAGE_FALLBACK || imagePath;
}

export async function resolveNewsImageUrl(
  image: string | undefined,
  title: string,
  lookup: MediaLookup,
): Promise<string> {
  const trimmed = image?.trim();
  if (!trimmed) return NEWS_IMAGE_FALLBACK;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const fromLibrary = pickFromLookup(lookup, trimmed);
    if (fromLibrary) {
      const url = canonicalSupabaseMediaUrl(fromLibrary);
      if (url) return url;
    }
    return rewriteSupabaseStorageUrl(trimmed);
  }

  if (trimmed.startsWith('/')) {
    return resolveLocalNewsImage(trimmed, lookup);
  }

  return trimmed;
}

/** Garante URLs de imagem estáveis (Supabase quando possível). */
export async function resolveNewsItemImages(news: NewsItem[]): Promise<NewsItem[]> {
  const lookup = await buildMediaLookup();

  return Promise.all(
    news.map(async (item) => ({
      ...item,
      image: await resolveNewsImageUrl(item.image, item.title, lookup),
    })),
  );
}
