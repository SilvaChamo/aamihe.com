'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useNews } from '@/context/NewsContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Search } from 'lucide-react';
import Link from 'next/link';

export default function NewsPage() {
  const params = useParams();
  const { news } = useNews();
  const id = Number(params.id);

  const article = news.find(n => n.id === id);

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Notícia não encontrada</h2>
      </div>
    );
  }

  return (
    <>
      <Header />

      <main id="main" className="site-main" style={{ marginTop: '0px' }}>
        {/* Banner */}
        <section className="custom-page-banner" style={{
          background: `url('${article.image}') no-repeat center center`,
          backgroundSize: 'cover',
          height: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: '0px'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.4)'
          }}></div>
        </section>

        <div className="container clr" style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px 40px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>

          <div id="primary" className="content-area">
            <div id="content" className="site-content">
              <div className="single-post-content" style={{ background: '#fff', padding: '40px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h1 style={{ fontFamily: '"Roboto Slab", serif', fontSize: '36px', fontWeight: 'bold', marginBottom: '15px', color: '#333', lineHeight: '1.3' }}>
                  {article.title}
                </h1>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', color: '#888', fontSize: '14px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} /> {article.date}
                  </div>
                  <div style={{ background: '#561713', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '12px' }}>
                    {article.category}
                  </div>
                </div>

                <div
                  className="post-content"
                  style={{ fontSize: '17px', lineHeight: '1.8', color: '#333', fontFamily: '"Roboto Slab", serif' }}
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </div>
            </div>
          </div>

          <aside id="right-sidebar" className="sidebar-container">
            <div className="sidebar-box" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex' }}>
                <input 
                  type="text" 
                  placeholder="Procurar..." 
                  style={{ 
                    flex: 1, 
                    padding: '12px 15px', 
                    border: '1px solid #ddd', 
                    borderRight: 'none',
                    borderRadius: '6px 0 0 6px', 
                    fontFamily: '"Roboto Slab", serif',
                    outline: 'none'
                  }} 
                />
                <button type="button" className="search-button" style={{ 
                  background: '#cca876', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '0 6px 6px 0', 
                  padding: '0 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}>
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div className="sidebar-box" style={{ marginBottom: '40px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #561713', paddingBottom: '10px', color: '#333' }}>
                Últimas Notícias
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {news.slice(0, 3).map(n => (
                  <Link key={n.id} href={`/noticias/${n.id}`} style={{ display: 'flex', gap: '15px', textDecoration: 'none' }}>
                    <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden' }}>
                      <img src={n.image} alt={n.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="sidebar-news-title">
                      {n.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="sidebar-box">
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #561713', paddingBottom: '10px', color: '#333' }}>
                Arquivo
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['2024', '2023', '2022', '2021'].map(year => (
                  <li key={year} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                    <a href="#" className="archive-link">Arquivo {year}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </main>

      <Footer />

      <style jsx>{`
        .container {
          padding-top: 40px;
          padding-bottom: 40px;
        }
        @media (max-width: 991px) {
          .container {
            grid-template-columns: 1fr;
          }
        }
        .archive-link {
          text-decoration: none;
          color: #561713;
          font-weight: bold;
          font-size: 15px;
          transition: color 0.2s ease;
        }
        .sidebar-news-link {
          display: flex;
          gap: 15px;
          color: #333;
          margin-bottom: 0;
          text-decoration: none;
        }
        .sidebar-news-title {
          font-size: 14px;
          font-weight: bold;
          line-height: 1.4;
          transition: color 0.2s ease;
        }
        .archive-link:hover, .sidebar-news-link:hover .sidebar-news-title {
          color: #cca876;
        }
        .search-button:hover {
          background: #92754c !important;
        }
      `}</style>
    </>
  );
}
