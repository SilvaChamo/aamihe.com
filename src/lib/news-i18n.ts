import { initialNewsData, type NewsItem, type NewsLocale, type NewsTranslation } from '@/data/news';

export function localizeNewsItem(item: NewsItem, locale: NewsLocale): NewsItem {
  if (locale === 'pt') return item;

  const translation = item.translations?.[locale];
  if (!translation) return item;

  return {
    ...item,
    title: translation.title || item.title,
    content: translation.content || item.content,
    summary: translation.summary ?? item.summary,
    category: translation.category || item.category,
  };
}

export function localizeNewsList(items: NewsItem[], locale: NewsLocale): NewsItem[] {
  return items.map((item) => localizeNewsItem(item, locale));
}

function translationFromSeed(item: NewsItem): NewsItem['translations'] {
  const fr = initialNewsData.fr.find((row) => row.id === item.id);
  const en = initialNewsData.en.find((row) => row.id === item.id);

  const translations: NonNullable<NewsItem['translations']> = { ...item.translations };

  if (fr && !translations.fr) {
    translations.fr = {
      title: fr.title,
      content: fr.content,
      summary: fr.summary,
      category: fr.category,
    };
  }

  if (en && !translations.en) {
    translations.en = {
      title: en.title,
      content: en.content,
      summary: en.summary,
      category: en.category,
    };
  }

  return Object.keys(translations).length > 0 ? translations : item.translations;
}

/** Preenche traduções em falta; opcionalmente força texto canónico em português (uma vez). */
export function migrateNewsCatalog(
  items: NewsItem[],
  options?: { applySeedPortuguese?: boolean }
): NewsItem[] {
  return items.map((item) => {
    const ptSeed = initialNewsData.pt.find((row) => row.id === item.id);
    const translations = translationFromSeed(item);

    if (!ptSeed) {
      return translations && translations !== item.translations
        ? { ...item, translations }
        : item;
    }

    if (!options?.applySeedPortuguese) {
      return translations !== item.translations ? { ...item, translations } : item;
    }

    const existingContentLen = (item.content || '').replace(/<[^>]+>/g, '').trim().length;
    const seedContentLen = (ptSeed.content || '').replace(/<[^>]+>/g, '').trim().length;
    const keepExistingBody = existingContentLen > seedContentLen + 80;

    return {
      ...item,
      date: item.date || ptSeed.date,
      image: item.image || ptSeed.image,
      author: item.author || ptSeed.author,
      status: item.status || ptSeed.status,
      title: item.title?.trim() ? item.title : ptSeed.title,
      content: keepExistingBody ? item.content : ptSeed.content,
      summary: item.summary?.trim() ? item.summary : (ptSeed.summary ?? item.summary),
      category: item.category || ptSeed.category,
      translations,
    };
  });
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

  const translation = item.translations?.[locale];
  return {
    title: translation?.title || '',
    content: translation?.content || '',
    summary: translation?.summary || '',
    category: translation?.category || item.category,
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
