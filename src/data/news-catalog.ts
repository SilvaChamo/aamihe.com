import type { NewsItem } from '@/data/news';
import { getNewsCatalog } from '@/data/noticias/merge-catalog-translations';

/** Catálogo estático (WordPress). Usado só para bootstrap/import — não em runtime público. */
export const newsCatalog: NewsItem[] = getNewsCatalog();
