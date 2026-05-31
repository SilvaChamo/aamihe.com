import type { NewsItem, NewsLocale, NewsTranslation } from '@/data/news';
import catalog from '@/data/noticias/catalog.json';
import contentTranslations from '@/data/noticias/content-translations.json';

type LocaleExtras = Partial<Record<NewsLocale, Partial<NewsTranslation>>>;

const extrasById = contentTranslations as Record<string, LocaleExtras>;

function mergeLocaleTranslation(
  base: NewsTranslation | undefined,
  extra: Partial<NewsTranslation> | undefined,
): NewsTranslation | undefined {
  if (!base && !extra) return undefined;
  return {
    title: base?.title ?? extra?.title ?? '',
    content: extra?.content ?? base?.content,
    summary: extra?.summary ?? base?.summary,
    category: base?.category ?? extra?.category,
  };
}

/** Catálogo WordPress com traduções de corpo completas (pt/en/fr). */
export function getNewsCatalog(): NewsItem[] {
  return (catalog as NewsItem[]).map((item) => {
    const extras = extrasById[String(item.id)] ?? {};
    const ptExtra = extras.pt;
    const enMerged = mergeLocaleTranslation(item.translations?.en, extras.en);
    const frMerged = mergeLocaleTranslation(item.translations?.fr, extras.fr);

    const translations: NewsItem['translations'] = {};
    if (enMerged?.title) translations.en = enMerged;
    if (frMerged?.title) translations.fr = frMerged;

    return {
      ...item,
      content: ptExtra?.content?.trim() ? ptExtra.content : item.content,
      summary: ptExtra?.summary?.trim() ? ptExtra.summary : item.summary,
      translations: Object.keys(translations).length > 0 ? translations : item.translations,
    };
  });
}
