const MEDIA_BUCKET = 'aamihe-media';

/** Origem pública do Supabase configurado (Hetzner). */
export function getSupabasePublicOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/$/, '') : '';
}

/** Reescreve qualquer URL Supabase Storage para a origem actual do projeto. */
export function rewriteSupabaseStorageUrl(url: string): string {
  const trimmed = url?.trim();
  if (!trimmed) return trimmed;

  const match = trimmed.match(/(\/storage\/v1\/object\/public\/[^?#]+)/i);
  if (!match) return trimmed;

  const origin = getSupabasePublicOrigin();
  if (!origin) return trimmed;

  return `${origin}${match[1]}`;
}

/** Caminho local antigo (/gallery/, /images/) → URL pública no bucket legacy/. */
export function legacyPublicPathToSupabaseUrl(publicPath: string): string | null {
  if (!publicPath.startsWith('/')) return null;

  const origin = getSupabasePublicOrigin();
  if (!origin) return null;

  const rel = publicPath.replace(/^\//, '').replace(/\\/g, '/');
  return `${origin}/storage/v1/object/public/${MEDIA_BUCKET}/legacy/${rel}`;
}

export function normalizeAssetUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:')) return trimmed;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('/storage/v1/object/public/')) {
      return rewriteSupabaseStorageUrl(trimmed);
    }
    return trimmed;
  }

  if (
    trimmed.startsWith('/gallery/') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('/uploads/')
  ) {
    return legacyPublicPathToSupabaseUrl(trimmed);
  }

  if (trimmed.startsWith('/')) return trimmed;
  return null;
}
