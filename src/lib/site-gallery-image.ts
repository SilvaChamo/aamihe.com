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
  if (aliases[normalized]) return aliases[normalized];
  if (aliases[localPath]) return aliases[localPath];
  if (urls.includes(normalized)) return normalized;
  return findBestGalleryUrl(normalized, urls) ?? FALLBACK;
}
