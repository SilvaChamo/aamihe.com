import { initialNewsData, type NewsItem, type NewsLocale, type NewsTranslation } from '@/data/news';

/** IDs do catálogo WordPress → IDs do seed local (initialNewsData). */
const SEED_ID_BY_CATALOG_ID: Record<number, number> = {
  7879: 1,
  7857: 2,
  7249: 3,
  7240: 4,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function resolveSeedId(item: NewsItem): number {
  return SEED_ID_BY_CATALOG_ID[item.id] ?? item.id;
}

function findSeedRow(item: NewsItem, locale: NewsLocale): NewsItem | undefined {
  const seedId = resolveSeedId(item);
  const byId = initialNewsData[locale]?.find((row) => row.id === seedId);
  if (byId) return byId;

  if (!item.image) return undefined;
  const image = item.image.trim();
  return initialNewsData[locale]?.find((row) => row.image?.trim() === image);
}

function seedToTranslation(seed: NewsItem): NewsTranslation {
  return {
    title: seed.title,
    content: seed.content,
    summary: seed.summary,
    category: seed.category,
  };
}

function applySeedFields(item: NewsItem, seed: NewsItem, preferSeedBody = false): NewsItem {
  const itemBodyLen = stripHtml(item.content || '').length;
  const seedBodyLen = stripHtml(seed.content || '').length;
  const keepItemBody = !preferSeedBody && itemBodyLen > seedBodyLen + 80;

  return {
    ...item,
    title: seed.title || item.title,
    content: keepItemBody ? item.content : seed.content || item.content,
    summary: seed.summary ?? item.summary,
    category: seed.category || item.category,
    date: seed.date || item.date,
  };
}

export function localizeNewsItem(item: NewsItem, locale: NewsLocale): NewsItem {
  if (locale !== 'pt') {
    const stored = item.translations?.[locale];
    if (stored?.title?.trim()) {
      return {
        ...item,
        title: stored.title || item.title,
        content: stored.content || item.content,
        summary: stored.summary ?? item.summary,
        category: stored.category || item.category,
      };
    }
  }

  const seed = findSeedRow(item, locale);
  if (seed) {
    return applySeedFields(item, seed, locale !== 'pt');
  }

  return item;
}

export function localizeNewsList(items: NewsItem[], locale: NewsLocale): NewsItem[] {
  return items.map((item) => localizeNewsItem(item, locale));
}

function translationFromSeed(item: NewsItem): NewsItem['translations'] {
  const fr = findSeedRow(item, 'fr');
  const en = findSeedRow(item, 'en');

  const translations: NonNullable<NewsItem['translations']> = { ...item.translations };

  if (fr && !translations.fr) {
    translations.fr = seedToTranslation(fr);
  }

  if (en && !translations.en) {
    translations.en = seedToTranslation(en);
  }

  return Object.keys(translations).length > 0 ? translations : item.translations;
}

/** Preenche traduções em falta; opcionalmente força texto canónico em português (uma vez). */
export function migrateNewsCatalog(
  items: NewsItem[],
  options?: { applySeedPortuguese?: boolean }
): NewsItem[] {
  return items.map((item) => {
    const ptSeed = findSeedRow(item, 'pt');
    const translations = translationFromSeed(item);

    if (!ptSeed) {
      return translations && translations !== item.translations
        ? { ...item, translations }
        : item;
    }

    if (!options?.applySeedPortuguese) {
      const withTranslations =
        translations !== item.translations ? { ...item, translations } : item;
      return applySeedFields(withTranslations, ptSeed);
    }

    const existingContentLen = stripHtml(item.content || '').length;
    const seedContentLen = stripHtml(ptSeed.content || '').length;
    const keepExistingBody = existingContentLen > seedContentLen + 80;

    return {
      ...item,
      date: item.date || ptSeed.date,
      image: item.image || ptSeed.image,
      author: item.author || ptSeed.author,
      status: item.status || ptSeed.status,
      title: ptSeed.title || item.title,
      content: keepExistingBody ? item.content : ptSeed.content,
      summary: item.summary?.trim() ? item.summary : (ptSeed.summary ?? item.summary),
      category: ptSeed.category || item.category,
      translations,
    };
  });
}

export function readNewsFieldsForLocale(item: NewsItem | undefined, locale: NewsLocale) {
  if (!item) {
    return { title: '', content: '', summary: '', category: '' };
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
