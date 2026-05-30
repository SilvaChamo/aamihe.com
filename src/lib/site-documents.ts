export type SiteDocumentLanguage = 'pt' | 'en' | 'fr';
export type SiteDocumentCategory = 'geral' | 'conferencia';

export type SiteDocumentRecord = {
  id: string;
  site_slug: string;
  title_pt: string;
  title_en: string | null;
  title_fr: string | null;
  file_url: string;
  language: SiteDocumentLanguage;
  category: SiteDocumentCategory;
  published: boolean;
  sort_order: number;
  author?: string;
  email?: string;
  user_id?: string;
  message?: string;
  year?: string;
  source?: 'form' | 'manual';
  created_at: string;
  updated_at: string;
};

export function localizeDocument(item: SiteDocumentRecord, language: SiteDocumentLanguage) {
  const title = item[`title_${language}`] || item.title_pt;
  return {
    id: item.id,
    site_slug: item.site_slug,
    title,
    file_url: item.file_url,
    language: item.language,
    category: item.category,
    author: item.author,
    year: item.year,
  };
}
