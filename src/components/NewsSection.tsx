'use client';

import { useLanguage } from '@/context/LanguageContext';
import './NewsSection.css';

const newsData = {
  pt: [
    {
      id: 1,
      date: '15 Mai, 2024',
      title: 'Conferência Anual de Educação Metodista',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800',
      category: 'Educação',
    },
    {
      id: 2,
      date: '10 Mai, 2024',
      title: 'Novas Bolsas de Estudo Disponíveis',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      category: 'Estudantes',
    },
    {
      id: 3,
      date: '05 Mai, 2024',
      title: 'Impacto Social nas Comunidades Locais',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      category: 'Comunidade',
    },
    {
      id: 4,
      date: '01 Mai, 2024',
      title: 'Lançamento do Novo Portal Académico',
      image: 'https://images.unsplash.com/photo-1434031211128-0c29b692f139?auto=format&fit=crop&q=80&w=800',
      category: 'Tecnologia',
    },
  ],
  fr: [
    {
      id: 1,
      date: '15 Mai, 2024',
      title: 'Conférence Annuelle sur l\'Éducation Méthodiste',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800',
      category: 'Éducation',
    },
    {
      id: 2,
      date: '10 Mai, 2024',
      title: 'Nouvelles Bourses d\'Études Disponibles',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      category: 'Étudiants',
    },
    {
      id: 3,
      date: '05 Mai, 2024',
      title: 'Impact Social dans les Communautés Locales',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      category: 'Communauté',
    },
    {
      id: 4,
      date: '01 Mai, 2024',
      title: 'Lancement du Nouveau Portail Académique',
      image: 'https://images.unsplash.com/photo-1434031211128-0c29b692f139?auto=format&fit=crop&q=80&w=800',
      category: 'Technologie',
    },
  ],
  en: [
    {
      id: 1,
      date: 'May 15, 2024',
      title: 'Annual Methodist Education Conference',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800',
      category: 'Education',
    },
    {
      id: 2,
      date: 'May 10, 2024',
      title: 'New Scholarships Available',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
      category: 'Students',
    },
    {
      id: 3,
      date: 'May 05, 2024',
      title: 'Social Impact in Local Communities',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
      category: 'Community',
    },
    {
      id: 4,
      date: 'May 01, 2024',
      title: 'Launch of the New Academic Portal',
      image: 'https://images.unsplash.com/photo-1434031211128-0c29b692f139?auto=format&fit=crop&q=80&w=800',
      category: 'Technology',
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
