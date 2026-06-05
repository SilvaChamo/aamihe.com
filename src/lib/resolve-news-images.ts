import type { NewsItem } from '@/data/news';
import { mediaCatalogKey, mediaQualityScore, mediaUniqueBasename } from '@/lib/media-catalog-key';
import { collectGalleryImages, resolveToGalleryUrl } from '@/lib/local-gallery-catalog';
import { supabaseOrPathToGalleryUrl } from '@/lib/local-gallery-mode';
import type { SiteMediaRecord } from '@/lib/site-media';

const NEWS_IMAGE_FALLBACK = '/gallery/Logo-Small.png.webp';

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

  for (const item of await collectGalleryImages()) {
    remember(byCatalogKey, mediaCatalogKey(item.url), item);
    remember(byBasename, mediaUniqueBasename(item.url), item);
    remember(byCatalogKey, item.url.toLowerCase(), item);
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

async function resolveNewsImage(imagePath: string, lookup: MediaLookup): Promise<string> {
  const fromLibrary = pickFromLookup(lookup, imagePath);
  if (fromLibrary) return fromLibrary.url;
  return resolveToGalleryUrl(imagePath);
}

export async function resolveNewsImageUrl(
  image: string | undefined,
  _title: string,
  lookup: MediaLookup,
): Promise<string> {
  const trimmed = image?.trim();
  if (!trimmed) return NEWS_IMAGE_FALLBACK;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const fromLibrary = pickFromLookup(lookup, trimmed);
    if (fromLibrary) return fromLibrary.url;
    return supabaseOrPathToGalleryUrl(trimmed) ?? trimmed;
  }

  if (trimmed.startsWith('/')) {
    return resolveNewsImage(trimmed, lookup);
  }

  return trimmed;
}

/** Notícias: melhor imagem disponível em public/gallery. */
export async function resolveNewsItemImages(news: NewsItem[]): Promise<NewsItem[]> {
  const lookup = await buildMediaLookup();

  return Promise.all(
    news.map(async (item) => ({
      ...item,
      image: await resolveNewsImageUrl(item.image, item.title, lookup),
    })),
  );
}
