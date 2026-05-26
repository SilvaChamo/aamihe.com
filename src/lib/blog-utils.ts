import type { NewsItem } from '@/data/news';

export function extractYearFromDate(date: string): string | null {
  const match = date.match(/\b(20\d{2})\b/);
  return match ? match[1] : null;
}

export function getArchiveYears(items: NewsItem[]): string[] {
  const years = new Set<string>();
  for (const item of items) {
    const year = extractYearFromDate(item.date);
    if (year) years.add(year);
  }
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

function translationHaystack(item: NewsItem): string {
  const parts = [item.title, item.category, item.summary || '', item.content || ''];
  if (item.translations?.fr) {
    parts.push(item.translations.fr.title, item.translations.fr.category || '', item.translations.fr.summary || '', item.translations.fr.content || '');
  }
  if (item.translations?.en) {
    parts.push(item.translations.en.title, item.translations.en.category || '', item.translations.en.summary || '', item.translations.en.content || '');
  }
  return parts.join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
}

export function filterNewsByQuery(items: NewsItem[], query: string): NewsItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = translationHaystack(item);
    return haystack.includes(q) || item.date.toLowerCase().includes(q);
  });
}

export function filterNewsByYear(items: NewsItem[], year: string): NewsItem[] {
  return items.filter((item) => extractYearFromDate(item.date) === year);
}
