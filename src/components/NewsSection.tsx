'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useLocalizedNews } from '@/hooks/useLocalizedNews';
import './NewsSection.css';

const copy = {
  pt: { title: 'Notícias & Eventos', more: 'Ler mais', viewAll: 'Ver todas as notícias' },
  fr: { title: 'Actualités & Événements', more: 'Lire la suite', viewAll: 'Voir toutes les actualités' },
  en: { title: 'News & Events', more: 'Read more', viewAll: 'View all news' },
} as const;

export default function NewsSection() {
  const { locale } = useLanguage();
  const { news } = useLocalizedNews();
  const t = copy[locale];

  const displayedNews = news.filter((item) => item.status !== 'draft').slice(0, 4);

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
                <img src={item.image} alt={item.title} className="news-card-photo" />
                <span className="news-card-category">{item.category}</span>
              </div>
              <div className="news-card-content">
                <span className="news-card-date">{item.date}</span>
                <h3 className="news-card-title">{item.title}</h3>
                <Link href={`/noticias/${item.id}`} className="news-card-link">
                  {t.more} <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="news-footer">
          <Link href="/noticias" className="btn-view-all">
            {t.viewAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
