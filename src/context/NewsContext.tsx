'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialNewsData, NewsItem } from '@/data/news';

interface NewsContextType {
  news: NewsItem[];
  addNews: (item: Omit<NewsItem, 'id'>) => void;
  updateNews: (id: number, updates: Partial<NewsItem>) => void;
  deleteNews: (id: number) => void;
  getNewsById: (id: number) => NewsItem | undefined;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    // Carregar do localStorage ou usar dados iniciais
    const savedNews = localStorage.getItem('aamihe_news');
    if (savedNews) {
      setNews(JSON.parse(savedNews));
    } else {
      // Usamos apenas o idioma padrão (PT) como base para a gestão simplificada
      setNews(initialNewsData.pt);
    }
  }, []);

  const saveNews = (updatedNews: NewsItem[]) => {
    setNews(updatedNews);
    localStorage.setItem('aamihe_news', JSON.stringify(updatedNews));
    
    // Disparar evento customizado para outros componentes (como a Home)
    window.dispatchEvent(new Event('newsUpdated'));
  };

  const addNews = (item: Omit<NewsItem, 'id'>) => {
    const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
    const newItem = { ...item, id: newId };
    saveNews([newItem, ...news]);
  };

  const updateNews = (id: number, updates: Partial<NewsItem>) => {
    const updated = news.map(n => n.id === id ? { ...n, ...updates } : n);
    saveNews(updated);
  };

  const deleteNews = (id: number) => {
    const updated = news.filter(n => n.id !== id);
    saveNews(updated);
  };

  const getNewsById = (id: number) => {
    return news.find(n => n.id === id);
  };

  return (
    <NewsContext.Provider value={{ news, addNews, updateNews, deleteNews, getNewsById }}>
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
