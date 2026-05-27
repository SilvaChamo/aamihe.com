import type { NewsItem } from '@/data/news';
import wordpressNews from '@/data/wordpress-news.json';

/**
 * Catálogo canónico importado do WordPress (WXR) + fallback local.
 * Usado como fallback e para bootstrap do Supabase quando a base está vazia.
 */
export const newsCatalog: NewsItem[] = wordpressNews as NewsItem[];
