import type { SiteMediaRecord } from '@/lib/site-media';

/** Nome de ficheiro normalizado (sem sufixo WordPress -300x200). */
export function mediaUniqueBasename(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const pathname = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? (() => {
        try {
          return new URL(trimmed).pathname;
        } catch {
          return trimmed;
        }
      })()
    : trimmed;

  const name = (pathname.split('/').pop() || pathname).toLowerCase();
  return name.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '');
}

/** Chave para URLs remotas (caminho completo). */
export function mediaCatalogKey(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).pathname.toLowerCase();
    } catch {
      return trimmed.toLowerCase();
    }
  }

  return mediaUniqueBasename(trimmed);
}

export function isLocalMediaPath(url: string | undefined): boolean {
  if (!url?.startsWith('/')) return false;
  return (
    url.startsWith('/gallery/') ||
    url.startsWith('/uploads/') ||
    url.startsWith('/images/') ||
    url.startsWith('/Imagens/')
  );
}

export function isSupabaseStorageUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('supabase.visualdesignmoz.com/storage') ||
    /\/storage\/v1\/object\//i.test(url)
  );
}

export function canDeleteMedia(item: { id: string; source?: string; url?: string }): boolean {
  if (item.id.startsWith('wp_') || item.id.startsWith('doc_media_')) return false;
  if (item.id.startsWith('site_')) {
    if (isLocalMediaPath(item.url)) return true;
    return isSupabaseStorageUrl(item.url);
  }
  if (isSupabaseStorageUrl(item.url)) return true;
  if (isLocalMediaPath(item.url)) return true;
  if (item.url?.includes('blob.vercel-storage.com')) return true;
  if (item.source === 'upload' || item.source === 'news') return true;
  if (item.id.startsWith('media_')) return true;
  return true;
}

export function mediaPriority(item: { source?: string; id: string; url: string }): number {
  if (item.url.startsWith('/gallery/') || item.url.startsWith('/images/')) return 5;
  if (item.source === 'upload' || item.source === 'news') return 4;
  if (item.id.startsWith('media_')) return 4;
  if (item.url.includes('supabase.visualdesignmoz.com/storage')) return 4;
  if (item.url.startsWith('/uploads/')) return 3;
  return 1;
}

function parseDimensionsFromUrl(url: string): number {
  const match = url.match(/-(\d+)x(\d+)(?=\.[a-z0-9]+$)/i);
  if (!match) return 0;
  return Number(match[1]) * Number(match[2]);
}

function isThumbnailUrl(url: string): boolean {
  return /-\d+x\d+(?=\.[a-z0-9]+$)/i.test(url);
}

/** Pontuação maior = melhor qualidade (tamanho, resolução, não-miniatura). */
export function mediaQualityScore(item: SiteMediaRecord): number {
  let score = mediaPriority(item) * 1_000_000;
  if (item.size && item.size > 0) score += item.size;
  score += parseDimensionsFromUrl(item.url);
  if (isThumbnailUrl(item.url)) score -= 500_000;
  if (item.url.includes('supabase.visualdesignmoz.com/storage')) score += 10_000;
  return score;
}

function pickPreferredMedia(existing: SiteMediaRecord, candidate: SiteMediaRecord): SiteMediaRecord {
  const existingScore = mediaQualityScore(existing);
  const candidateScore = mediaQualityScore(candidate);
  if (candidateScore !== existingScore) {
    return candidateScore > existingScore ? candidate : existing;
  }

  const existingLocal = existing.url.startsWith('/');
  const candidateLocal = candidate.url.startsWith('/');
  if (candidateLocal && !existingLocal) return candidate;
  if (existingLocal && !candidateLocal) return existing;
  return candidate;
}

export function dedupeMediaRecords(items: SiteMediaRecord[]) {
  const byId = new Map<string, SiteMediaRecord>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    byId.set(item.id, pickPreferredMedia(existing, item));
  }

  const byBasename = new Map<string, SiteMediaRecord>();
  for (const item of byId.values()) {
    const key = mediaUniqueBasename(item.url);
    if (!key) continue;
    const existing = byBasename.get(key);
    if (!existing) {
      byBasename.set(key, item);
      continue;
    }
    byBasename.set(key, pickPreferredMedia(existing, item));
  }

  return Array.from(byBasename.values());
}
