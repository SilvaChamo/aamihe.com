'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNews } from '@/context/NewsContext';
import '@/components/NewsSection.css';
import './noticias.css';

export default function NoticiasPage() {
  const { news } = useNews();
  const published = news.filter((item) => item.status !== 'draft');

  return (
    <>
      <Header />
      <main className="noticias-page">
        <div className="noticias-hero">
          <div className="news-container">
            <h1>Notícias & Eventos</h1>
            <p>Arquivo de notícias da AAMIHE</p>
          </div>
        </div>

        <div className="news-container">
          <div className="news-grid noticias-grid">
            {published.map((item) => (
              <article key={item.id} className="news-card">
                <div className="news-card-image">
                  <img src={item.image} alt={item.title} />
                  <span className="news-card-category">{item.category}</span>
                </div>
                <div className="news-card-content">
                  <span className="news-card-date">{item.date}</span>
                  <h2 className="news-card-title">{item.title}</h2>
                  {item.summary && <p className="noticias-summary">{item.summary}</p>}
                  <Link href={`/noticias/${item.id}`} className="news-card-link">
                    Ler mais <span className="arrow">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
