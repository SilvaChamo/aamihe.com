export interface NewsCategory {
  name: string;
  slug: string;
  description?: string;
  etiqueta?: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  { name: 'Institucional', slug: 'institucional', description: '', etiqueta: '' },
  { name: 'Educação', slug: 'educacao', description: '', etiqueta: '' },
  { name: 'Desenvolvimento', slug: 'desenvolvimento', description: '', etiqueta: '' },
  { name: 'Eventos', slug: 'eventos', description: '', etiqueta: '' },
];

export const NEWS_CATEGORY_NAMES = NEWS_CATEGORIES.map((category) => category.name);

export function slugifyCategory(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
