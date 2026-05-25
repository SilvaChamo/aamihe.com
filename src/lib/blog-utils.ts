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

export function filterNewsByQuery(items: NewsItem[], query: string): NewsItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const plainContent = item.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase() ?? '';
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.summary?.toLowerCase().includes(q) ?? false) ||
      item.date.toLowerCase().includes(q) ||
      plainContent.includes(q)
    );
  });
}

export function filterNewsByYear(items: NewsItem[], year: string): NewsItem[] {
  return items.filter((item) => extractYearFromDate(item.date) === year);
}
