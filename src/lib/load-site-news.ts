import { newsCatalog } from '@/data/news-catalog';
import { NEWS_CATEGORIES, type NewsCategory } from '@/data/news-categories';
import { enrichNewsList } from '@/data/noticias/merge-catalog-translations';
import type { NewsItem } from '@/data/news';
import { resolveNewsItemImages } from '@/lib/resolve-news-images';
import { loadSiteContentFromSupabase, saveSiteContentToSupabase } from '@/lib/supabase-content';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export type LoadedSiteNews = {
  news: NewsItem[];
  categories: NewsCategory[];
  source: 'supabase' | 'static';
  bootstrapped: boolean;
};

/**
 * Fonte única de notícias para painel e site público.
 * Só aplica enrichNewsList ao catálogo estático — edições no Supabase não são sobrescritas.
 */
export async function loadSiteNews(options?: {
  bootstrapIfEmpty?: boolean;
}): Promise<LoadedSiteNews> {
  const bootstrapIfEmpty = options?.bootstrapIfEmpty ?? false;

  const fromSupabase = await loadSiteContentFromSupabase();
  let news: NewsItem[] = fromSupabase?.news?.length ? fromSupabase.news : [];
  let categories: NewsCategory[] = fromSupabase?.categories?.length
    ? fromSupabase.categories
    : NEWS_CATEGORIES;
  let source: 'supabase' | 'static' = news.length > 0 ? 'supabase' : 'static';
  let bootstrapped = false;

  if (news.length === 0 && bootstrapIfEmpty && isSupabaseConfigured()) {
    const seed = enrichNewsList(await resolveNewsItemImages(newsCatalog));
    const saved = await saveSiteContentToSupabase({
      news: seed,
      categories,
      documents: [],
    });
    if (saved) {
      news = seed;
      source = 'supabase';
      bootstrapped = true;
    }
  }

  if (news.length === 0) {
    news = newsCatalog;
    source = 'static';
  }

  if (source === 'static') {
    news = enrichNewsList(await resolveNewsItemImages(news));
  }

  return { news, categories, source, bootstrapped };
}
