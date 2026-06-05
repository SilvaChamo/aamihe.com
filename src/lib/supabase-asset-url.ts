import { supabaseOrPathToGalleryUrl } from '@/lib/local-gallery-mode';

/** Normaliza URL de imagem — galeria sempre em /gallery/... (public/). */
export function normalizeAssetUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:')) return trimmed;

  if (trimmed.startsWith('/gallery/') || trimmed.startsWith('/images/')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return supabaseOrPathToGalleryUrl(trimmed) ?? trimmed;
  }

  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

/** @deprecated Avatares/documentos — não usar para galeria. */
export function getSupabasePublicOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

export function rewriteSupabaseStorageUrl(url: string): string {
  return supabaseOrPathToGalleryUrl(url) ?? url;
}

export function legacyPublicPathToSupabaseUrl(publicPath: string): string | null {
  if (!publicPath.startsWith('/gallery/')) return null;
  return publicPath;
}
