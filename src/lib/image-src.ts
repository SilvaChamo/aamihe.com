/** Normaliza URL de imagem (caminhos locais ou absolutos). */
export function normalizeImageSrc(src: string | null | undefined): string | null {
  const trimmed = src?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return trimmed;
  return null;
}

/** Domínios permitidos para optimização via next/image. */
export function canOptimizeImageSrc(src: string): boolean {
  if (src.startsWith('data:')) return false;
  if (src.startsWith('/')) return true;

  try {
    const host = new URL(src).hostname.toLowerCase();
    if (host.endsWith('.supabase.co')) return true;
    if (host === 'aamihe.com' || host.endsWith('.aamihe.com')) return true;
    if (host.endsWith('.public.blob.vercel-storage.com')) return true;
    if (host.endsWith('.blob.vercel-storage.com')) return true;
    return false;
  } catch {
    return false;
  }
}
