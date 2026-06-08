import galleryAliases from '@/data/gallery-aliases.json';
import galleryUrls from '@/data/gallery-urls.json';
import { findBestGalleryUrl } from '@/lib/gallery-match';
import { normalizeAssetUrl } from '@/lib/supabase-asset-url';

const FALLBACK = '/gallery/Logo-Small.png.webp';
const aliases = galleryAliases as Record<string, string>;
const urls = galleryUrls as string[];

/** Galeria do site: resolve para ficheiro existente em public/gallery. */
export function siteGalleryImage(localPath: string): string {
  const normalized = normalizeAssetUrl(localPath) ?? localPath;
  if (!normalized) return FALLBACK;
  if (normalized.includes('/.trash/')) return normalized;

  if (aliases[normalized]) return aliases[normalized];
  if (aliases[localPath]) return aliases[localPath];
  if (urls.includes(normalized)) return normalized;

  const matched = findBestGalleryUrl(normalized, urls);
  if (matched) return matched;

  // URLs guardadas pelo painel (ex.: /gallery/news-*.jpg) podem não estar no JSON estático
  if (
    normalized.startsWith('/gallery/') ||
    normalized.startsWith('/uploads/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    return normalized;
  }

  return FALLBACK;
}
