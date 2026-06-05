/** Galeria do site: sempre public/gallery no projecto (local e produção). */
export function isLocalGalleryMode(): boolean {
  return true;
}

/** Converte URL Supabase ou caminho legado → /gallery/... */
export function supabaseOrPathToGalleryUrl(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/gallery/')) return trimmed;

  const legacyMatch = trimmed.match(/\/legacy\/gallery\/(.+?)(?:\?|#|$)/i);
  if (legacyMatch) {
    return `/gallery/${decodeURIComponent(legacyMatch[1])}`;
  }

  let filename = '';
  if (trimmed.startsWith('/')) {
    const parts = trimmed.replace(/^\//, '').split('/');
    if (parts[0] === 'gallery') return trimmed;
    filename = parts.pop() || '';
  } else if (trimmed.startsWith('http')) {
    try {
      const pathname = new URL(trimmed).pathname;
      const legacy = pathname.match(/\/legacy\/gallery\/(.+)$/i);
      if (legacy) return `/gallery/${decodeURIComponent(legacy[1])}`;

      // Avatares, PDFs e outros buckets Supabase — manter URL completa (não /gallery/).
      if (/\/storage\/v1\/object\/public\//i.test(pathname)) {
        return null;
      }

      filename = decodeURIComponent(pathname.split('/').pop() || '');
    } catch {
      return null;
    }
  }
  if (!filename) return null;
  return `/gallery/${filename}`;
}
