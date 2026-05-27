'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { newsCatalog } from '@/data/news-catalog';
import { NewsItem } from '@/data/news';
import { migrateNewsCatalog } from '@/lib/news-i18n';
import { mergeNewsCatalog } from '@/lib/site-content-merge';
import { persistNewsImage } from '@/lib/persist-client-media';
import { NEWS_CATEGORIES, NewsCategory, slugifyCategory } from '@/data/news-categories';

interface NewsContextType {
  news: NewsItem[];
  categories: NewsCategory[];
  addNews: (item: Omit<NewsItem, 'id'>) => void;
  updateNews: (id: number, updates: Partial<NewsItem>) => void;
  deleteNews: (id: number) => void;
  getNewsById: (id: number) => NewsItem | undefined;
  addCategory: (category: { name: string; description?: string; slug?: string; etiqueta?: string }) => string | null;
  updateCategory: (slug: string, updates: Partial<NewsCategory>) => string | null;
  deleteCategory: (slug: string) => string | null;
  getCategoryBySlug: (slug: string) => NewsCategory | undefined;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

async function pushContentToServer(news: NewsItem[], categories: NewsCategory[]) {
  try {
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news, categories }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Erro ao sincronizar conteúdo:', data.error);
    }
  } catch (err) {
    console.error('Erro ao sincronizar conteúdo com o servidor', err);
  }
}

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const imagesSynced = useRef(false);

  useEffect(() => {
    (async () => {
      let loadedCategories: NewsCategory[] = NEWS_CATEGORIES;
      try {
        const savedCategories = localStorage.getItem('aamihe_news_categories');
        if (savedCategories) {
          loadedCategories = JSON.parse(savedCategories);
        }
      } catch {
        /* ignore */
      }

      let items: NewsItem[] = migrateNewsCatalog(newsCatalog);
      try {
        const savedNews = localStorage.getItem('aamihe_news');
        if (savedNews) {
          items = mergeNewsCatalog(migrateNewsCatalog(newsCatalog), JSON.parse(savedNews));
        }
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch('/api/admin/content');
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.news) && data.news.length > 0) {
            items = mergeNewsCatalog(migrateNewsCatalog(newsCatalog), data.news);
            localStorage.setItem('aamihe_news', JSON.stringify(items));
          }
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            loadedCategories = data.categories;
            localStorage.setItem('aamihe_news_categories', JSON.stringify(loadedCategories));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar conteúdo remoto', err);
      }

      const migrated = migrateNewsCatalog(items);
      if (JSON.stringify(migrated) !== JSON.stringify(items)) {
        items = migrated;
        localStorage.setItem('aamihe_news', JSON.stringify(items));
      }

      setCategories(loadedCategories);

      if (!imagesSynced.current) {
        imagesSynced.current = true;
        let changed = false;
        items = await Promise.all(
          items.map(async (item) => {
            if (!item.image) return item;
            try {
              const url = await persistNewsImage(item.image, item.title);
              if (url !== item.image) {
                changed = true;
                return { ...item, image: url };
              }
              return item;
            } catch (err) {
              console.error('Erro ao sincronizar imagem da notícia', item.id, err);
              return item;
            }
          }),
        );
        if (changed) {
          localStorage.setItem('aamihe_news', JSON.stringify(items));
          window.dispatchEvent(new Event('newsUpdated'));
        }
      }

      setNews(items);
    })();
  }, []);

  const saveNews = (updatedNews: NewsItem[]) => {
    setNews(updatedNews);
    localStorage.setItem('aamihe_news', JSON.stringify(updatedNews));
    window.dispatchEvent(new Event('newsUpdated'));
    void pushContentToServer(updatedNews, categories);
  };

  const saveCategories = (updatedCategories: NewsCategory[]) => {
    setCategories(updatedCategories);
    localStorage.setItem('aamihe_news_categories', JSON.stringify(updatedCategories));
    window.dispatchEvent(new Event('newsCategoriesUpdated'));
    void pushContentToServer(news, updatedCategories);
  };

  const addNews = (item: Omit<NewsItem, 'id'>) => {
    const newId = news.length > 0 ? Math.max(...news.map((n) => n.id)) + 1 : 1;
    const newItem = { ...item, id: newId };
    saveNews([newItem, ...news]);
  };

  const updateNews = (id: number, updates: Partial<NewsItem>) => {
    const updated = news.map((n) => (n.id === id ? { ...n, ...updates } : n));
    saveNews(updated);
  };

  const deleteNews = (id: number) => {
    const updated = news.filter((n) => n.id !== id);
    saveNews(updated);
  };

  const getNewsById = (id: number) => news.find((n) => n.id === id);

  const getCategoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

  const addCategory = (category: { name: string; description?: string; slug?: string; etiqueta?: string }) => {
    const name = category.name.trim();
    if (!name) return 'Indique o nome da categoria.';

    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return 'Já existe uma categoria com este nome.';
    }

    const baseSlug = slugifyCategory(category.slug?.trim() || name);
    let slug = baseSlug || 'categoria';
    let suffix = 2;
    while (categories.some((c) => c.slug === slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    saveCategories([
      ...categories,
      { name, slug, description: category.description?.trim() || '', etiqueta: category.etiqueta?.trim() || '' },
    ]);
    return null;
  };

  const updateCategory = (slug: string, updates: Partial<NewsCategory>) => {
    const current = categories.find((c) => c.slug === slug);
    if (!current) return 'Categoria não encontrada.';

    const name = updates.name?.trim() ?? current.name;
    const description = updates.description?.trim() ?? current.description ?? '';
    const etiqueta = updates.etiqueta?.trim() ?? current.etiqueta ?? '';
    const nextSlugInput = updates.slug?.trim();
    const nextSlug = nextSlugInput ? slugifyCategory(nextSlugInput) : current.slug;

    if (!name) return 'Indique o nome da categoria.';
    if (!nextSlug) return 'Indique um slug válido.';

    if (categories.some((c) => c.slug !== slug && c.name.toLowerCase() === name.toLowerCase())) {
      return 'Já existe uma categoria com este nome.';
    }

    if (categories.some((c) => c.slug !== slug && c.slug === nextSlug)) {
      return 'Já existe uma categoria com este slug.';
    }

    const updatedCategories = categories.map((c) =>
      c.slug === slug ? { ...c, name, description, etiqueta, slug: nextSlug } : c,
    );

    if (name !== current.name) {
      const updatedNews = news.map((item) =>
        item.category === current.name ? { ...item, category: name } : item,
      );
      saveNews(updatedNews);
    }

    saveCategories(updatedCategories);
    return null;
  };

  const deleteCategory = (slug: string) => {
    const current = categories.find((c) => c.slug === slug);
    if (!current) return 'Categoria não encontrada.';

    const count = news.filter((item) => item.category === current.name).length;
    if (count > 0) {
      return `Não é possível eliminar: existem ${count} notícia(s) nesta categoria.`;
    }

    saveCategories(categories.filter((c) => c.slug !== slug));
    return null;
  };

  return (
    <NewsContext.Provider
      value={{
        news,
        categories,
        addNews,
        updateNews,
        deleteNews,
        getNewsById,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryBySlug,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
