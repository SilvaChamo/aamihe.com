'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useNews } from '@/context/NewsContext';
import './NewsSection.css';

const translations = {
  pt: {
    title: 'Notícias & Eventos',
    more: 'Ler mais',
    viewAll: 'Ver todas as notícias',
  },
  fr: {
    title: 'Nouvelles & Événements',
    more: 'Lire la suite',
    viewAll: 'Voir todas as novas',
  },
  en: {
    title: 'News & Events',
    more: 'Read more',
    viewAll: 'View all news',
  },
};

export default function NewsSection() {
  const { locale } = useLanguage();
  const { news } = useNews();
  const t = (translations as any)[locale] || translations.pt;

  // Mostramos apenas os primeiros 4 itens na Home
  // (Em um cenário real, poderíamos filtrar por idioma se tivéssemos campos separados)
  const displayedNews = news.slice(0, 4);

  return (
    <section className="news-section">
      <div className="news-container">
        <div className="news-header">
          <h2 className="news-section-title">{t.title}</h2>
        </div>

        <div className="news-grid">
          {displayedNews.map((item) => (
            <div key={item.id} className="news-card">
              <div className="news-card-image">
                <img src={item.image} alt={item.title} />
                <span className="news-card-category">{item.category}</span>
              </div>
              <div className="news-card-content">
                <span className="news-card-date">{item.date}</span>
                <h3 className="news-card-title">{item.title}</h3>
                <a href={`/noticias/${item.id}`} className="news-card-link">
                  {t.more} <span className="arrow">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="news-footer">
          <a href="/noticias" className="btn-view-all">
            {t.viewAll}
          </a>
        </div>
      </div>
    </section>
  );
}
