export type NewsLocale = 'pt' | 'fr' | 'en';

export type NewsTranslation = {
  title: string;
  content?: string;
  summary?: string;
  category?: string;
};

export interface NewsItem {
  id: number;
  date: string;
  title: string;
  image: string;
  category: string;
  content: string;
  summary?: string;
  author?: string;
  status?: 'published' | 'draft' | 'pending';
  /** Francês e inglês; português fica nos campos principais. */
  translations?: {
    fr?: NewsTranslation;
    en?: NewsTranslation;
  };
}
