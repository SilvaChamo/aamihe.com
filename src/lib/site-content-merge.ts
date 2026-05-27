import type { NewsItem } from '@/data/news';

function contentLength(item: NewsItem): number {
  return (item.content || '').replace(/<[^>]+>/g, '').trim().length;
}

/** Mantém o texto mais completo; nunca substitui artigo rico por resumo curto. */
export function mergeNewsItem(existing: NewsItem, incoming: NewsItem): NewsItem {
  const existingLen = contentLength(existing);
  const incomingLen = contentLength(incoming);

  const pickContent =
    incomingLen > existingLen + 40
      ? incoming.content
      : existingLen > incomingLen + 40
        ? existing.content
        : incoming.content || existing.content;

  const pickTitle = existing.title?.trim() ? existing.title : incoming.title;
  const pickSummary = (existing.summary?.length ?? 0) >= (incoming.summary?.length ?? 0)
    ? existing.summary
    : incoming.summary;

  return {
    ...existing,
    ...incoming,
    id: existing.id,
    title: pickTitle || incoming.title,
    content: pickContent,
    summary: pickSummary ?? existing.summary ?? incoming.summary,
    image: existing.image || incoming.image,
    date: existing.date || incoming.date,
    category: existing.category || incoming.category,
    author: existing.author || incoming.author,
    status: existing.status || incoming.status || 'published',
    translations: {
      ...incoming.translations,
      ...existing.translations,
    },
  };
}

export function mergeNewsCatalog(existing: NewsItem[], incoming: NewsItem[]): NewsItem[] {
  const byId = new Map<number, NewsItem>();

  for (const item of existing) {
    byId.set(item.id, item);
  }

  for (const item of incoming) {
    const prev = byId.get(item.id);
    byId.set(item.id, prev ? mergeNewsItem(prev, item) : item);
  }

  return Array.from(byId.values()).sort((a, b) => b.id - a.id);
}
