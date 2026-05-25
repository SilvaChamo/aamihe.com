/** Chave para evitar a mesma imagem repetida com URLs diferentes. */
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

  const name = (trimmed.split('/').pop() || trimmed).toLowerCase();
  return name
    .replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '')
    .replace(/^news-\d+-[a-f0-9]+/i, 'news-upload');
}

export function canDeleteMedia(item: { id: string; source?: string; url?: string }): boolean {
  if (item.url?.includes('supabase.co/storage')) return true;
  if (item.source === 'upload' || item.source === 'news') return true;
  if (item.id.startsWith('media_')) return true;
  if (item.id.startsWith('wp_') || item.id.startsWith('doc_media_')) return false;
  if (item.id.startsWith('site_') && item.url?.startsWith('/')) return false;
  return true;
}

export function mediaPriority(item: { source?: string; id: string; url: string }): number {
  if (item.url.startsWith('/gallery/') || item.url.startsWith('/images/')) return 5;
  if (item.source === 'upload' || item.source === 'news') return 4;
  if (item.id.startsWith('media_')) return 4;
  if (item.url.includes('supabase.co/storage')) return 4;
  if (item.url.startsWith('/uploads/')) return 3;
  return 1;
}

function pickPreferredMedia(
  existing: import('@/lib/site-media').SiteMediaRecord,
  candidate: import('@/lib/site-media').SiteMediaRecord
): import('@/lib/site-media').SiteMediaRecord {
  const existingPriority = mediaPriority(existing);
  const candidatePriority = mediaPriority(candidate);
  if (candidatePriority !== existingPriority) {
    return candidatePriority > existingPriority ? candidate : existing;
  }
  const existingLocal = existing.url.startsWith('/');
  const candidateLocal = candidate.url.startsWith('/');
  if (candidateLocal && !existingLocal) return candidate;
  if (existingLocal && !candidateLocal) return existing;
  return candidate;
}

export function dedupeMediaRecords(items: import('@/lib/site-media').SiteMediaRecord[]) {
  const byId = new Map<string, import('@/lib/site-media').SiteMediaRecord>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    byId.set(item.id, pickPreferredMedia(existing, item));
  }

  const byKey = new Map<string, import('@/lib/site-media').SiteMediaRecord>();
  for (const item of byId.values()) {
    const key = mediaCatalogKey(item.url);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    byKey.set(key, pickPreferredMedia(existing, item));
  }

  return Array.from(byKey.values());
}
