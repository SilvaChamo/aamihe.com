import { siteGalleryImage } from '@/lib/site-gallery-image';
import { normalizeAssetUrl } from '@/lib/supabase-asset-url';

/** Normaliza URL de imagem — galeria em public/gallery. */
export function normalizeImageSrc(src: string | null | undefined): string | null {
  const normalized = normalizeAssetUrl(src);
  if (!normalized) return null;
  if (
    normalized.startsWith('/gallery/') ||
    normalized.startsWith('/images/') ||
    normalized.startsWith('/Imagens/')
  ) {
    return siteGalleryImage(src ?? normalized);
  }
  return normalized;
}

/** Domínios permitidos para optimização via next/image. */
export function canOptimizeImageSrc(src: string): boolean {
  if (src.startsWith('data:')) return false;
  if (src.startsWith('/')) return true;

  if (/\/storage\/v1\/object\/public\//i.test(src)) return true;

  try {
    const host = new URL(src).hostname.toLowerCase();
    if (host.includes('supabase')) return true;
    if (host.endsWith('.supabase.co')) return true;
    if (host === 'aamihe.com' || host.endsWith('.aamihe.com')) return true;
    return false;
  } catch {
    return false;
  }
}
