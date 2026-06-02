'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, FileUp, ImageIcon, Newspaper, Users } from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import { adminFetch } from '@/lib/admin-auth';
import { useLanguage } from '@/context/LanguageContext';
import { PanelStatsSkeleton } from '@/components/Admin/PanelSkeleton';
import './SiteStatsPage.css';

type Stats = {
  news: number;
  media: number;
  users: number;
  conferenceSubmissions: number;
};

const EMPTY_STATS: Stats = {
  news: 0,
  media: 0,
  users: 0,
  conferenceSubmissions: 0,
};

export default function SiteStatsPage() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const base = useAdminBase();
  const { locale } = useLanguage();
  const analyticsDashboardUrl = process.env.NEXT_PUBLIC_GA_DASHBOARD_URL?.trim() || '';
  const t = {
    pt: {
      title: 'Estatísticas do Site',
      subtitle: 'Visão geral dos principais conteúdos do painel.',
      news: 'Notícias',
      media: 'Multimédia',
      users: 'Utilizadores',
      conf: 'Submissões da Conferência',
      ga: 'Google Analytics',
      openFull: 'Abrir painel completo',
      openGa: 'Abrir Google Analytics',
      empty:
        'Defina `NEXT_PUBLIC_GA_DASHBOARD_URL` no ambiente para mostrar o painel embutido com acessos por país, sistema operativo, navegador e dispositivos.',
    },
    fr: {
      title: 'Statistiques du site',
      subtitle: 'Vue d’ensemble des contenus principaux du panneau.',
      news: 'Actualités',
      media: 'Multimédia',
      users: 'Utilisateurs',
      conf: 'Soumissions de conférence',
      ga: 'Google Analytics',
      openFull: 'Ouvrir le tableau complet',
      openGa: 'Ouvrir Google Analytics',
      empty:
        "Définissez `NEXT_PUBLIC_GA_DASHBOARD_URL` pour afficher le tableau intégré avec accès par pays, système, navigateur et appareils.",
    },
    en: {
      title: 'Site Statistics',
      subtitle: 'Overview of the main panel contents.',
      news: 'News',
      media: 'Media',
      users: 'Users',
      conf: 'Conference Submissions',
      ga: 'Google Analytics',
      openFull: 'Open full dashboard',
      openGa: 'Open Google Analytics',
      empty:
        'Set `NEXT_PUBLIC_GA_DASHBOARD_URL` to show the embedded panel with traffic by country, operating system, browser, and devices.',
    },
  } as const;
  const tx = t[locale];

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [statsRes, usersRes, docsRes] = await Promise.all([
          adminFetch('/api/admin/dashboard/stats', { cache: 'no-store' }),
          adminFetch('/api/admin/users/list', { cache: 'no-store' }),
          adminFetch('/api/admin/documents?category=conferencia', { cache: 'no-store' }),
        ]);

        const [statsData, usersData, docsData] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          docsRes.json(),
        ]);

        if (cancelled) return;

        setStats({
          news: statsData?.stats?.news ?? 0,
          media: statsData?.stats?.media ?? 0,
          users: Array.isArray(usersData?.users) ? usersData.users.length : 0,
          conferenceSubmissions: Array.isArray(docsData?.documents) ? docsData.documents.length : 0,
        });
      } catch {
        if (!cancelled) setStats(EMPTY_STATS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="site-stats-page">
      <div className="site-stats-header">
        <h1>
          <Activity size={20} /> {tx.title}
        </h1>
        <p>{tx.subtitle}</p>
      </div>

      {loading ? (
        <>
          <PanelStatsSkeleton count={4} />

          <div className="site-stats-analytics">
            <div className="site-stats-analytics-header">
              <div
                className="wp-skeleton-pulse"
                style={{ height: 16, width: 190, background: '#dcdcde', borderRadius: 6 }}
                aria-hidden
              />
              <div
                className="wp-skeleton-pulse"
                style={{ height: 14, width: 160, background: '#dcdcde', borderRadius: 6 }}
                aria-hidden
              />
            </div>

            <div
              className="site-stats-analytics-frame wp-skeleton-pulse"
              style={{ background: '#f3f4f6' }}
              aria-hidden
            />
          </div>
        </>
      ) : (
        <>
          <div className="site-stats-grid">
            <Link href={`${base}/noticias`} className="site-stats-card">
              <div className="site-stats-icon"><Newspaper size={18} /></div>
              <div className="site-stats-value">{stats.news}</div>
              <div className="site-stats-label">{tx.news}</div>
            </Link>

            <Link href={`${base}/media`} className="site-stats-card">
              <div className="site-stats-icon"><ImageIcon size={18} /></div>
              <div className="site-stats-value">{stats.media}</div>
              <div className="site-stats-label">{tx.media}</div>
            </Link>

            <Link href={`${base}/utilizadores`} className="site-stats-card">
              <div className="site-stats-icon"><Users size={18} /></div>
              <div className="site-stats-value">{stats.users}</div>
              <div className="site-stats-label">{tx.users}</div>
            </Link>

            <Link href={`${base}/documentos-gerais`} className="site-stats-card">
              <div className="site-stats-icon"><FileUp size={18} /></div>
              <div className="site-stats-value">{stats.conferenceSubmissions}</div>
              <div className="site-stats-label">{tx.conf}</div>
            </Link>
          </div>

          <div className="site-stats-analytics">
            <div className="site-stats-analytics-header">
              <h2>{tx.ga}</h2>
              {analyticsDashboardUrl ? (
                <a href={analyticsDashboardUrl} target="_blank" rel="noreferrer">
                  {tx.openFull}
                </a>
              ) : (
                <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noreferrer">
                  {tx.openGa}
                </a>
              )}
            </div>

            {analyticsDashboardUrl ? (
              <iframe
                title="Google Analytics Dashboard"
                src={analyticsDashboardUrl}
                className="site-stats-analytics-frame"
              />
            ) : (
              <div className="site-stats-analytics-empty">
                {tx.empty}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
