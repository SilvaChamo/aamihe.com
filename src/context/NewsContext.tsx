'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { NewsItem } from '@/data/news';
import { newsCatalog } from '@/data/news-catalog';
import { NEWS_CATEGORIES, NewsCategory, slugifyCategory } from '@/data/news-categories';

interface NewsContextType {
  news: NewsItem[];
  categories: NewsCategory[];
  loading: boolean;
  ensureLoaded: () => Promise<void>;
  reload: () => Promise<void>;
  addNews: (item: Omit<NewsItem, 'id'>) => void;
  updateNews: (id: number, updates: Partial<NewsItem>) => void;
  deleteNews: (id: number) => void;
  getNewsById: (id: number) => NewsItem | undefined;
  addCategory: (category: {
    name: string;
    description?: string;
    slug?: string;
    etiqueta?: string;
  }) => string | null;
  updateCategory: (slug: string, updates: Partial<NewsCategory>) => string | null;
  deleteCategory: (slug: string) => string | null;
  getCategoryBySlug: (slug: string) => NewsCategory | undefined;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

async function pushContentToServer(news: NewsItem[], categories: NewsCategory[]) {
  const res = await fetch('/api/admin/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ news, categories }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Erro ao sincronizar notícias com o servidor',
    );
  }
}

async function loadResolvedCatalogFallback(): Promise<NewsItem[]> {
  try {
    const res = await fetch('/api/public/news', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && Array.isArray(data.news) && data.news.length > 0) {
      return data.news;
    }
  } catch {
    /* ignora */
  }
  return newsCatalog;
}

async function loadContentFromServer(): Promise<{ news: NewsItem[]; categories: NewsCategory[] }> {
  const res = await fetch('/api/public/news', { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erro ao carregar notícias');
  }
  return {
    news: Array.isArray(data.news) ? data.news : [],
    categories: Array.isArray(data.categories) ? data.categories : NEWS_CATEGORIES,
  };
}

async function loadAdminContentFromServer(): Promise<{ news: NewsItem[]; categories: NewsCategory[] }> {
  const res = await fetch('/api/admin/content', { cache: 'no-store' });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Erro ao carregar notícias');
  }
  return {
    news: Array.isArray(data.news) ? data.news : [],
    categories: Array.isArray(data.categories) ? data.categories : NEWS_CATEGORIES,
  };
}

function isAdminPath(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/dashboard') ||
    window.location.pathname.startsWith('/admin')
  );
}

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>(NEWS_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const loadPromise = useRef<Promise<void> | null>(null);

  const fetchAndApply = useCallback(async (force = false) => {
    if (!force && loadPromise.current) return loadPromise.current;

    setLoading(true);
    loadPromise.current = (async () => {
      try {
        const loader = isAdminPath() ? loadAdminContentFromServer : loadContentFromServer;
        const data = await loader();
        setNews(data.news);
        setCategories(data.categories);
      } catch (err) {
        console.error('Erro ao carregar notícias', err);
        setNews(await loadResolvedCatalogFallback());
        setCategories(NEWS_CATEGORIES);
      } finally {
        setLoading(false);
        loadPromise.current = null;
      }
    })();

    return loadPromise.current;
  }, []);

  const ensureLoaded = useCallback(() => {
    if (news.length > 0 && !loading) return Promise.resolve();
    return fetchAndApply();
  }, [news.length, loading, fetchAndApply]);

  const reload = useCallback(() => fetchAndApply(true), [fetchAndApply]);

  useEffect(() => {
    void fetchAndApply();
  }, [fetchAndApply]);

  useEffect(() => {
    const onNewsUpdated = () => {
      void reload();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void reload();
      }
    };

    window.addEventListener('newsUpdated', onNewsUpdated);
    window.addEventListener('newsCategoriesUpdated', onNewsUpdated);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('newsUpdated', onNewsUpdated);
      window.removeEventListener('newsCategoriesUpdated', onNewsUpdated);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  const saveNews = (updatedNews: NewsItem[]) => {
    setNews(updatedNews);
    void pushContentToServer(updatedNews, categories)
      .then(() => {
        window.dispatchEvent(new Event('newsUpdated'));
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : 'Erro ao guardar notícias.');
      });
  };

  const saveCategories = (updatedCategories: NewsCategory[]) => {
    setCategories(updatedCategories);
    void pushContentToServer(news, updatedCategories)
      .then(() => {
        window.dispatchEvent(new Event('newsCategoriesUpdated'));
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : 'Erro ao guardar categorias.');
      });
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
    saveNews(news.filter((n) => n.id !== id));
  };

  const getNewsById = (id: number) => news.find((n) => n.id === id);

  const getCategoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

  const addCategory = (category: {
    name: string;
    description?: string;
    slug?: string;
    etiqueta?: string;
  }) => {
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
      {
        name,
        slug,
        description: category.description?.trim() || '',
        etiqueta: category.etiqueta?.trim() || '',
      },
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
        loading,
        addNews,
        updateNews,
        deleteNews,
        getNewsById,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryBySlug,
        ensureLoaded,
        reload,
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

  const { ensureLoaded } = context;

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  return context;
}
