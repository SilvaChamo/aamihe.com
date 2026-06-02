export type MediaCategory = 'imagens' | 'videos' | 'documentos';

export type MediaSource = 'upload' | 'news' | 'document' | 'legacy';

export type SiteMediaRecord = {
  id: string;
  site_slug: string;
  title: string;
  url: string;
  category: MediaCategory;
  subcategory: string;
  mime_type: string;
  size?: number;
  source: MediaSource;
  source_id?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  alt_text?: string;
  caption?: string;
  description?: string;
};

export type PublicMediaItem = {
  id: string;
  title: string;
  url: string;
  category: MediaCategory;
  subcategory: string;
  mime_type: string;
};

export function inferMediaCategory(mimeType: string): MediaCategory {
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('image/')) return 'imagens';
  return 'documentos';
}

export function inferMediaCategoryFromUrl(url: string): MediaCategory {
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/.test(lower)) return 'videos';
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(lower)) return 'imagens';
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)(\?|$)/.test(lower)) return 'documentos';
  return 'imagens';
}
