import { supabaseOrPathToGalleryUrl } from '@/lib/local-gallery-mode';

/** Normaliza URL de imagem — galeria sempre em /gallery/... (public/). */
export function normalizeAssetUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:')) return trimmed;

  if (trimmed.startsWith('/gallery/')) {
    return trimmed;
  }

  if (trimmed.startsWith('/images/')) {
    return trimmed.replace(/^\/images\//, '/gallery/');
  }

  if (trimmed.startsWith('/Imagens/')) {
    return trimmed.replace(/^\/Imagens\//, '/gallery/');
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const legacy = trimmed.replace(
      'https://supabase.aamihe.com',
      'https://supabase.visualdesignmoz.com',
    );
    return supabaseOrPathToGalleryUrl(legacy) ?? legacy;
  }

  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

/** @deprecated Avatares/documentos — não usar para galeria. */
export function getSupabasePublicOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

/** Avatares (bucket avatars) — URL Supabase directa, sem rewrite para /gallery/. */
export function resolveAvatarUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return trimmed;
}

/** Reescreve só URLs legadas de galeria; avatares e documentos ficam intactos. */
export function rewriteSupabaseStorageUrl(url: string): string {
  return supabaseOrPathToGalleryUrl(url) ?? url;
}

export function legacyPublicPathToSupabaseUrl(publicPath: string): string | null {
  if (!publicPath.startsWith('/gallery/')) return null;
  return publicPath;
}
