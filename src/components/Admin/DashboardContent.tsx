'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ImageIcon, 
  Plus, 
  Activity, 
  Video, 
  FileUp,
  Settings,
  Mail,
} from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import { adminFetch } from '@/lib/admin-auth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useLanguage } from '@/context/LanguageContext';
import { adminDashboardCopy, tMessages } from '@/i18n/messages';
import { PanelActivitySkeleton, PanelStatsSkeleton } from '@/components/Admin/PanelSkeleton';
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

const DATE_LOCALE = { pt: 'pt-PT', fr: 'fr-FR', en: 'en-GB' } as const;

export default function DashboardContent() {
  const base = useAdminBase();
  const { canManageNews } = useAdminPermissions();
  const { locale } = useLanguage();
  const t = tMessages(adminDashboardCopy, locale);
  const [stats, setStats] = React.useState<Stats>({
    news: 0,
    media: 0,
    videos: 0,
    documents: 0,
  });
  const [statsLoading, setStatsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await adminFetch('/api/admin/dashboard/stats', { cache: 'no-store' });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.stats) {
          setStats({
            news: data.stats.news ?? 0,
            media: data.stats.media ?? 0,
            videos: data.stats.videos ?? 0,
            documents: data.stats.documents ?? 0,
          });
          return;
        }
      } catch {
        if (!cancelled) {
          setStats({ news: 0, media: 0, videos: 0, documents: 0 });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
            {canManageNews ? (
              <div>
                <h3 className="dashboard-section-title">{t.introTitle}</h3>
                <Link href={`${base}/noticias/nova`} className="dashboard-button">
                  {t.addNews}
                </Link>
              </div>
            ) : null}

            <div>
              <h3 className="dashboard-section-title">{t.nextSteps}</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href={`${base}/estatisticas`} className="dashboard-list-item">
                    <Activity /> {t.stats}
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
              <h3 className="dashboard-section-title">{t.moreActions}</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href={`${base}/enviar-email`} className="dashboard-list-item">
                    <Mail /> {t.sendEmail}
                  </Link>
                </li>
                <li>
                  <Link href={`${base}/media`} className="dashboard-list-item">
                    <Plus /> {t.mediaLibrary}
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
                    <FileUp /> {t.receivedSummaries}
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
                {statsLoading ? (
                  <PanelActivitySkeleton count={4} />
                ) : recentActivities.length > 0 ? (
                  <ul className="dashboard-activity-list">
                    {recentActivities.slice(0, 4).map((activity) => (
                      <li key={activity.id} className="dashboard-activity-item">
                        <p className="dashboard-activity-date">
                          {new Date(activity.date).toLocaleDateString(DATE_LOCALE[locale], {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="dashboard-activity-title">{activity.title}</p>
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
            {statsLoading ? (
              <PanelStatsSkeleton count={4} />
            ) : (
            <div className="dashboard-stats-grid">
              <Link href={`${base}/documentos-gerais`} className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon blue">
                    <FileUp />
                  </div>
                  <span className="dashboard-stat-value">
                    {statsLoading ? '...' : stats.documents}
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
                    {statsLoading ? '...' : stats.media}
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
                    {statsLoading ? '...' : stats.videos}
                  </span>
                  <span className="dashboard-stat-label">
                    {t.videos}
                  </span>
                </div>
              </Link>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
