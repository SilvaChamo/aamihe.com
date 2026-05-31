import type { NewsItem, NewsLocale, NewsTranslation } from '@/data/news';

export function localizeNewsItem(item: NewsItem, locale: NewsLocale): NewsItem {
  if (locale === 'pt') return item;

  const translation = item.translations?.[locale];
  if (!translation?.title?.trim()) return item;

  return {
    ...item,
    title: translation.title,
    content: translation.content?.trim() ? translation.content : item.content,
    summary: translation.summary ?? item.summary,
    category: translation.category || item.category,
  };
}

export function localizeNewsList(items: NewsItem[], locale: NewsLocale): NewsItem[] {
  return items.map((item) => localizeNewsItem(item, locale));
}

export function readNewsFieldsForLocale(item: NewsItem | undefined, locale: NewsLocale) {
  if (!item) {
    return { title: '', content: '', summary: '', category: '' };
  }

  if (locale === 'pt') {
    return {
      title: item.title,
      content: item.content,
      summary: item.summary || '',
      category: item.category,
    };
  }

  const localized = localizeNewsItem(item, locale);
  return {
    title: localized.title,
    content: localized.content,
    summary: localized.summary || '',
    category: localized.category,
  };
}

export function buildNewsSavePayload(
  existing: NewsItem | undefined,
  locale: NewsLocale,
  fields: {
    title: string;
    content: string;
    summary: string;
    category: string;
    date: string;
    image: string;
    status: NewsItem['status'];
    author?: string;
  }
): Omit<NewsItem, 'id'> | Partial<NewsItem> {
  const base = {
    date: fields.date,
    image: fields.image,
    status: fields.status,
    author: fields.author ?? existing?.author,
  };

  if (locale === 'pt') {
    return {
      ...base,
      title: fields.title,
      content: fields.content,
      summary: fields.summary,
      category: fields.category,
      translations: existing?.translations,
    };
  }

  const translation: NewsTranslation = {
    title: fields.title,
    content: fields.content,
    summary: fields.summary,
    category: fields.category,
  };

  return {
    ...base,
    title: existing?.title || 'Notícia',
    content: existing?.content || '',
    summary: existing?.summary || '',
    category: existing?.category || fields.category,
    translations: {
      ...existing?.translations,
      [locale]: translation,
    },
  };
}
