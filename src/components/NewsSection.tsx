'use client';

import { useLanguage } from '@/context/LanguageContext';
import './NewsSection.css';

const newsData = {
  pt: [
    {
      id: 1,
      date: '15 Mai, 2024',
      title: 'Conferência Anual de Educação Metodista',
      excerpt: 'Líderes educacionais de toda a África reúnem-se para discutir o futuro do ensino superior...',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800',
      category: 'Educação',
    },
    {
      id: 2,
      date: '10 Mai, 2024',
      title: 'Novas Bolsas de Estudo Disponíveis',
      excerpt: 'A AAIMES anuncia novo programa de bolsas para estudantes de teologia e ciências...',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      category: 'Estudantes',
    },
    {
      id: 3,
      date: '05 Mai, 2024',
      title: 'Impacto Social nas Comunidades Locais',
      excerpt: 'Como as nossas instituições estão a transformar a realidade das comunidades através de projetos...',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      category: 'Comunidade',
    },
  ],
  fr: [
    {
      id: 1,
      date: '15 Mai, 2024',
      title: 'Conférence Annuelle sur l\'Éducation Méthodiste',
      excerpt: 'Les leaders de l\'éducation de toute l\'Afrique se réunissent pour discuter de l\'avenir...',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800',
      category: 'Éducation',
    },
    {
      id: 2,
      date: '10 Mai, 2024',
      title: 'Nouvelles Bourses d\'Études Disponibles',
      excerpt: 'L\'AAIMES annonce un nouveau programme de bourses pour les étudiants en théologie...',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      category: 'Étudiants',
    },
    {
      id: 3,
      date: '05 Mai, 2024',
      title: 'Impact Social dans les Communautés Locales',
      excerpt: 'Comment nos institutions transforment la réalité des communautés à travers des projets...',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      category: 'Communauté',
    },
  ],
  en: [
    {
      id: 1,
      date: 'May 15, 2024',
      title: 'Annual Methodist Education Conference',
      excerpt: 'Educational leaders from across Africa gather to discuss the future of higher education...',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800',
      category: 'Education',
    },
    {
      id: 2,
      date: 'May 10, 2024',
      title: 'New Scholarships Available',
      excerpt: 'AAMIHE announces a new scholarship program for theology and science students...',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      category: 'Students',
    },
    {
      id: 3,
      date: 'May 05, 2024',
      title: 'Social Impact in Local Communities',
      excerpt: 'How our institutions are transforming community reality through social projects...',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      category: 'Community',
    },
  ],
};

const translations = {
  pt: {
    title: 'Notícias & Eventos',
    subtitle: 'Fique por dentro das últimas atualizações da AAIMES e das nossas instituições membros.',
    more: 'Ler mais',
    viewAll: 'Ver todas as notícias',
  },
  fr: {
    title: 'Nouvelles & Événements',
    subtitle: 'Restez au courant des dernières mises à jour de l\'AAIMES et de nos institutions membres.',
    more: 'Lire la suite',
    viewAll: 'Voir toutes les nouvelles',
  },
  en: {
    title: 'News & Events',
    subtitle: 'Stay up to date with the latest updates from AAMIHE and our member institutions.',
    more: 'Read more',
    viewAll: 'View all news',
  },
};

export default function NewsSection() {
  const { locale } = useLanguage();
  const t = translations[locale];
  const news = newsData[locale];

  return (
    <section className="news-section">
      <div className="news-container">
        <div className="news-header">
          <h2 className="news-section-title">{t.title}</h2>
          <p className="news-section-subtitle">{t.subtitle}</p>
        </div>

        <div className="news-grid">
          {news.map((item) => (
            <div key={item.id} className="news-card">
              <div className="news-card-image">
                <img src={item.image} alt={item.title} />
                <span className="news-card-category">{item.category}</span>
              </div>
              <div className="news-card-content">
                <span className="news-card-date">{item.date}</span>
                <h3 className="news-card-title">{item.title}</h3>
                <p className="news-card-excerpt">{item.excerpt}</p>
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
