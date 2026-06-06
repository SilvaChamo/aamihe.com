import { supabaseOrPathToGalleryUrl } from '@/lib/local-gallery-mode';

/** @deprecated Avatares/documentos — não usar para galeria. */
export function getSupabasePublicOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

/** Reescreve URLs de Storage gravadas com outro host Supabase para o origin actual. */
function rewriteToCurrentSupabaseOrigin(url: string): string {
  const origin = getSupabasePublicOrigin();
  if (!origin) return url;

  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes('/storage/v1/object/public/')) return url;
    if (parsed.origin === origin) return url;
    return `${origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

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
    const normalized = rewriteToCurrentSupabaseOrigin(trimmed);
    return supabaseOrPathToGalleryUrl(normalized) ?? normalized;
  }

  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

/** Caminho público Supabase Storage (bucket avatars, media, etc.). */
function extractSupabaseStoragePath(url: string): string | null {
  const match = url.match(/(\/storage\/v1\/object\/public\/[^?#]+)/i);
  return match?.[1] ?? null;
}

/** Avatares (bucket avatars) — URL Supabase directa, sem rewrite para /gallery/. */
export function resolveAvatarUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return trimmed;

  const storagePath = extractSupabaseStoragePath(trimmed);
  const origin = getSupabasePublicOrigin();

  if (storagePath && origin) {
    return `${origin}${storagePath}`;
  }

  if (trimmed.startsWith('/storage/v1/object/public/') && origin) {
    return `${origin}${trimmed}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return rewriteToCurrentSupabaseOrigin(trimmed);
  }

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
