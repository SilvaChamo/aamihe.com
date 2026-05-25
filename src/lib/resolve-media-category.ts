import type { MediaCategory } from '@/lib/site-media';
import { inferMediaCategoryFromUrl } from '@/lib/site-media';

type MediaLike = {
  category?: string;
  mime_type?: string;
  url?: string;
};

/** Categoria efectiva para filtros (corrige registos mal classificados no upload). */
export function resolveMediaCategory(item: MediaLike): MediaCategory {
  const mime = item.mime_type || '';
  if (mime.startsWith('image/')) return 'imagens';
  if (mime.startsWith('video/')) return 'videos';
  if (
    mime.startsWith('application/pdf') ||
    mime.startsWith('application/msword') ||
    mime.startsWith('application/vnd.')
  ) {
    return 'documentos';
  }

  if (item.url) {
    return inferMediaCategoryFromUrl(item.url);
  }

  if (item.category === 'imagens' || item.category === 'videos' || item.category === 'documentos') {
    return item.category;
  }

  return 'imagens';
}
