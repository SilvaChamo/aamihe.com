'use client';

import Link from 'next/link';
import { use } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNews } from '@/context/NewsContext';
import '@/components/NewsSection.css';
import '../noticias.css';

export default function NoticiaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getNewsById, news } = useNews();
  const item = getNewsById(parseInt(id, 10));

  if (!item) {
    return (
      <>
        <Header />
        <main className="noticias-page">
          <div className="news-container noticias-empty">
            <h1>Notícia não encontrada</h1>
            <Link href="/noticias" className="news-card-link">← Voltar às notícias</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const related = news.filter((n) => n.id !== item.id && n.category === item.category).slice(0, 3);

  return (
    <>
      <Header />
      <main className="noticias-page">
        <div className="news-container noticias-article">
          <nav className="noticias-breadcrumb">
            <Link href="/">Início</Link>
            <span>/</span>
            <Link href="/noticias">Notícias</Link>
            <span>/</span>
            <span>{item.title}</span>
          </nav>

          <span className="news-card-category noticias-badge">{item.category}</span>
          <h1 className="noticias-title">{item.title}</h1>
          <p className="noticias-meta">{item.date}{item.author ? ` · ${item.author}` : ''}</p>

          {item.image && (
            <div className="noticias-featured-image">
              <img src={item.image} alt={item.title} />
            </div>
          )}

          <div className="noticias-body">
            {item.content.split('\n').filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {related.length > 0 && (
            <section className="noticias-related">
              <h2>Notícias relacionadas</h2>
              <div className="news-grid noticias-related-grid">
                {related.map((rel) => (
                  <article key={rel.id} className="news-card">
                    <div className="news-card-image">
                      <img src={rel.image} alt={rel.title} />
                    </div>
                    <div className="news-card-content">
                      <h3 className="news-card-title">{rel.title}</h3>
                      <Link href={`/noticias/${rel.id}`} className="news-card-link">
                        Ler mais <span className="arrow">→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
