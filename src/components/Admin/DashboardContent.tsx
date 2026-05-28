'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ImageIcon, 
  Plus, 
  Activity, 
  Video, 
  FileUp,
  Settings
} from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import { useLanguage } from '@/context/LanguageContext';
import './DashboardContent.css';

interface Stats {
  news: number;
  media: number;
  videos: number;
  documents: number;
}

interface ActivityItem {
  id: string;
  title: string;
  date: string;
  type: 'news' | 'media' | 'document';
}

export default function DashboardContent() {
  const base = useAdminBase();
  const { locale } = useLanguage();
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);

  const copy = {
    pt: {
      welcomeTitle: 'Bem-vindo ao painel de administração',
      welcomeSubtitle: 'Este é o painel de gestão do site AAMIHE.',
      introTitle: 'Introdução',
      manageDocs: 'Gerir Documentos',
      addNews: 'Adicionar notícia',
      nextSteps: 'Próximos passos',
      reviewConf: 'Gerir notícias',
      stats: 'Ver estatísticas do site',
      moreActions: 'Mais acções',
      addMedia: 'Adicionar multimédia',
      siteConfig: 'Configurações do site',
      conferenceSummary: 'Resumo da Conferência',
      documents: 'Documentos',
      subscribers: 'Subscritores',
      submittedDocs: 'Documentos submetidos',
      videos: 'Vídeos',
      recent: 'Actividades Recentes',
      noActivity: 'Nenhuma actividade recente encontrada.',
      gallery: 'Galeria',
      submissions: 'Submissões',
      form: 'Formulário',
    },
    fr: {
      welcomeTitle: "Bienvenue dans le panneau d'administration",
      welcomeSubtitle: "Ceci est le panneau de gestion du site AAMIHE.",
      introTitle: 'Introduction',
      manageDocs: 'Gérer les documents',
      addNews: 'Ajouter une actualité',
      nextSteps: 'Prochaines étapes',
      reviewConf: 'Gérer les actualités',
      stats: 'Voir les statistiques du site',
      moreActions: 'Plus dactions',
      addMedia: 'Ajouter du multimédia',
      siteConfig: 'Paramètres du site',
      conferenceSummary: 'Résumé de la conférence',
      documents: 'Documents',
      subscribers: 'Abonnés',
      submittedDocs: 'Documents soumis',
      videos: 'Vidéos',
      recent: 'Activités récentes',
      noActivity: 'Aucune activité récente trouvée.',
      gallery: 'Galerie',
      submissions: 'Soumissions',
      form: 'Formulaire',
    },
    en: {
      welcomeTitle: 'Welcome to the admin dashboard',
      welcomeSubtitle: 'This is the AAMIHE site management panel.',
      introTitle: 'Introduction',
      manageDocs: 'Manage Documents',
      addNews: 'Add news',
      nextSteps: 'Next steps',
      reviewConf: 'Manage news',
      stats: 'View site statistics',
      moreActions: 'More actions',
      addMedia: 'Add media',
      siteConfig: 'Site settings',
      conferenceSummary: 'Conference summary',
      documents: 'Documents',
      subscribers: 'Subscribers',
      submittedDocs: 'Submitted documents',
      videos: 'Videos',
      recent: 'Recent activity',
      noActivity: 'No recent activity found.',
      gallery: 'Gallery',
      submissions: 'Submissions',
      form: 'Form',
    },
  } as const;
  const t = copy[locale];

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/users/me', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const role = String(data?.user?.role || '').toLowerCase();
        const isSuper =
          role.includes('super') ||
          role.includes('superadmin') ||
          role.includes('super admin');
        if (!cancelled) setIsSuperAdmin(isSuper);
      } catch {
        if (!cancelled) setIsSuperAdmin(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
  // Mock data for now - can be replaced with real data later
  const stats: Stats = {
    news: 0,
    media: 0,
    videos: 0,
    documents: 0,
  };

  const recentActivities: ActivityItem[] = [];

  return (
    <div className="dashboard-container">
      <section className="dashboard-welcome-section">
        <div className="dashboard-content">
          <div className="dashboard-welcome-soft-box">
            <h1 className="dashboard-title">
              {t.welcomeTitle}
            </h1>
            <p className="dashboard-subtitle">
              {t.welcomeSubtitle}
            </p>
          </div>
          
          <div className="dashboard-grid">
            <div>
              <h3 className="dashboard-section-title">
                {t.introTitle}
              </h3>
              <Link 
                href={isSuperAdmin ? `${base}/noticias/nova` : `${base}/documentos-gerais`}
                className="dashboard-button"
              >
                {isSuperAdmin ? t.addNews : t.manageDocs}
              </Link>
            </div>
            
            <div>
              <h3 className="dashboard-section-title">{t.nextSteps}</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href={`${base}/noticias`} className="dashboard-list-item">
                    <FileUp /> {t.reviewConf}
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/estatisticas`} className="dashboard-list-item">
                    <Activity /> {t.stats}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="dashboard-section-title">{t.moreActions}</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href={`${base}/media`} className="dashboard-list-item">
                    <Plus /> {t.addMedia}
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/definicoes`} className="dashboard-list-item">
                    <Settings /> {t.siteConfig}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="dashboard-summary-title">
                {t.conferenceSummary}
              </h3>
              <ul className="dashboard-list">
                <li>
                  <Link href={`${base}/utilizadores/subscritores`} className="dashboard-list-item">
                    <Activity /> {t.subscribers}
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/documentos-gerais`} className="dashboard-list-item">
                    <FileUp /> {t.submittedDocs}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-main-content">
        <div className="dashboard-content-grid">
          <div className="h-full">
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">
                  <Activity />
                  {t.recent}
                </h2>
              </div>
              <div className="dashboard-card-body">
                {recentActivities.length > 0 ? (
                  <ul className="dashboard-activity-list">
                    {recentActivities.slice(0, 4).map(activity => (
                      <li key={activity.id} className="dashboard-activity-item">
                        <p className="dashboard-activity-date">{new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="dashboard-activity-title">
                          {activity.title}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="dashboard-no-activity">{t.noActivity}</p>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-stats-column">
            <div className="dashboard-stats-grid">
              <Link href={`${base}/documentos-gerais`} className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon blue">
                    <FileUp />
                  </div>
                  <span className="dashboard-stat-value">
                    {stats.documents}
                  </span>
                  <span className="dashboard-stat-label">
                    {t.documents}
                  </span>
                </div>
              </Link>

              <Link href={`${base}/documentos-gerais`} className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon green">
                    <Plus />
                  </div>
                  <span className="dashboard-stat-value">
                    {t.form}
                  </span>
                  <span className="dashboard-stat-label">
                    {t.submissions}
                  </span>
                </div>
              </Link>

              <Link href={`${base}/media`} className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon purple">
                    <ImageIcon />
                  </div>
                  <span className="dashboard-stat-value">
                    {stats.media}
                  </span>
                  <span className="dashboard-stat-label">
                    {t.gallery}
                  </span>
                </div>
              </Link>

              <Link href={`${base}/media/videos`} className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon amber">
                    <Video />
                  </div>
                  <span className="dashboard-stat-value">
                    {stats.videos}
                  </span>
                  <span className="dashboard-stat-label">
                    {t.videos}
                  </span>
                </div>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
