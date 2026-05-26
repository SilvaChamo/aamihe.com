'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useNews } from '@/context/NewsContext';
import { localizeNewsItem, localizeNewsList } from '@/lib/news-i18n';

export function useLocalizedNews() {
  const { locale } = useLanguage();
  const newsContext = useNews();

  const news = useMemo(() => localizeNewsList(newsContext.news, locale), [newsContext.news, locale]);

  const getNewsById = (id: number) => {
    const item = newsContext.getNewsById(id);
    return item ? localizeNewsItem(item, locale) : undefined;
  };

  return {
    ...newsContext,
    news,
    getNewsById,
    locale,
  };
}
