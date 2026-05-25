'use client';

import Link from 'next/link';
import { useNews } from '@/context/NewsContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import './NewsSection.css';

const NEWS_CARD_IMAGE_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw';

const t = {
  title: 'Notícias & Eventos',
  more: 'Ler mais',
  viewAll: 'Ver todas as notícias',
};

export default function NewsSection() {
  const { news } = useNews();

  const displayedNews = news.filter((item) => item.status !== 'draft').slice(0, 4);

  return (
    <section className="news-section">
      <div className="news-container">
        <div className="news-header">
          <h2 className="news-section-title">{t.title}</h2>
        </div>

        <div className="news-grid">
          {displayedNews.map((item, index) => (
            <div key={item.id} className="news-card">
              <div className="news-card-image">
                {item.image?.trim() ? (
                  <OptimizedImage
                    src={item.image}
                    alt={item.title}
                    fill
                    className="news-card-photo"
                    sizes={NEWS_CARD_IMAGE_SIZES}
                    priority={index === 0}
                    quality={75}
                  />
                ) : null}
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
