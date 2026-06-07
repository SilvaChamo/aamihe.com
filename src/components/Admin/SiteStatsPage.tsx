'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  FileUp,
  ImageIcon,
  Newspaper,
  Users,
  Radio,
  RefreshCw,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import { adminFetch } from '@/lib/admin-auth';
import { useLanguage } from '@/context/LanguageContext';
import type { Ga4RealtimeSnapshot } from '@/lib/google-analytics';
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

const EMPTY_SNAPSHOT: Ga4RealtimeSnapshot = {
  configured: false,
  measurementId: 'G-JJJZM7P441',
  propertyId: null,
  activeUsers: 0,
  pages: [],
  countries: [],
  devices: [],
  sources: [],
  updatedAt: new Date().toISOString(),
  authMode: null,
};

function formatUpdatedAt(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-PT' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function BreakdownTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: Ga4RealtimeSnapshot['countries'];
  emptyLabel: string;
}) {
  return (
    <div className="site-stats-breakdown">
      <h3>{title}</h3>
      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li key={`${title}-${row.label}`}>
              <span>{row.label}</span>
              <strong>{row.activeUsers}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="site-stats-breakdown-empty">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function SiteStatsPage() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsRefreshing, setAnalyticsRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<Ga4RealtimeSnapshot>(EMPTY_SNAPSHOT);
  const [analyticsError, setAnalyticsError] = useState('');
  const base = useAdminBase();
  const { locale } = useLanguage();
  const searchParams = useSearchParams();
  const measurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || snapshot.measurementId || 'G-JJJZM7P441';

  const t = {
    pt: {
      title: 'Estatísticas do Site',
      subtitle: 'Visão geral dos principais conteúdos do painel.',
      news: 'Notícias',
      media: 'Multimédia',
      users: 'Utilizadores',
      conf: 'Submissões da Conferência',
      ga: 'Visitantes em tempo real',
      live: 'Ao vivo',
      activeNow: 'Utilizadores activos agora',
      updated: 'Actualizado às',
      refresh: 'Actualizar',
      connect: 'Ligar Google Analytics',
      openGa: 'Abrir Google Analytics',
      tracking: 'Código de medição activo no site',
      countries: 'Países',
      pages: 'Páginas',
      devices: 'Dispositivos',
      sources: 'Origens',
      noData: 'Sem visitantes neste momento.',
      notConnected:
        'Ligue a conta Google com acesso ao Analytics deste site para ver visitantes em tempo real.',
      connectHint:
        'Use uma conta Google com acesso à propriedade GA4 do site. O código {id} já está instalado no site público.',
      propertyMissing:
        'Conta ligada, mas a propriedade GA4 não foi detectada. Defina GA4_PROPERTY_ID no servidor ou use uma conta com acesso à propriedade correcta.',
      loadError: 'Não foi possível carregar as estatísticas em tempo real.',
    },
    fr: {
      title: 'Statistiques du site',
      subtitle: 'Vue d’ensemble des contenus principaux du panneau.',
      news: 'Actualités',
      media: 'Multimédia',
      users: 'Utilisateurs',
      conf: 'Soumissions de conférence',
      ga: 'Visiteurs en temps réel',
      live: 'En direct',
      activeNow: 'Utilisateurs actifs maintenant',
      updated: 'Mis à jour à',
      refresh: 'Actualiser',
      connect: 'Connecter Google Analytics',
      openGa: 'Ouvrir Google Analytics',
      tracking: 'Code de mesure actif sur le site',
      countries: 'Pays',
      pages: 'Pages',
      devices: 'Appareils',
      sources: 'Sources',
      noData: 'Aucun visiteur pour le moment.',
      notConnected:
        'Connectez le compte Google avec accès à Analytics pour voir les visiteurs en temps réel.',
      connectHint:
        'Utilisez un compte Google ayant accès à la propriété GA4. Le code {id} est déjà installé sur le site.',
      propertyMissing:
        'Compte connecté, mais la propriété GA4 est introuvable. Définissez GA4_PROPERTY_ID sur le serveur.',
      loadError: 'Impossible de charger les statistiques en temps réel.',
    },
    en: {
      title: 'Site Statistics',
      subtitle: 'Overview of the main panel contents.',
      news: 'News',
      media: 'Media',
      users: 'Users',
      conf: 'Conference Submissions',
      ga: 'Real-time visitors',
      live: 'Live',
      activeNow: 'Active users now',
      updated: 'Updated at',
      refresh: 'Refresh',
      connect: 'Connect Google Analytics',
      openGa: 'Open Google Analytics',
      tracking: 'Measurement code active on the site',
      countries: 'Countries',
      pages: 'Pages',
      devices: 'Devices',
      sources: 'Sources',
      noData: 'No visitors right now.',
      notConnected:
        'Connect the Google account with Analytics access to view real-time visitors.',
      connectHint:
        'Use a Google account with access to the GA4 property. Code {id} is already installed on the public site.',
      propertyMissing:
        'Account connected, but the GA4 property was not found. Set GA4_PROPERTY_ID on the server.',
      loadError: 'Could not load real-time statistics.',
    },
  } as const;
  const tx = t[locale];

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [statsRes, docsRes] = await Promise.all([
          adminFetch('/api/admin/dashboard/stats', { cache: 'no-store' }),
          adminFetch('/api/admin/documents?category=conferencia', { cache: 'no-store' }),
        ]);

        const [statsData, docsData] = await Promise.all([
          statsRes.json(),
          docsRes.json(),
        ]);

        if (cancelled) return;

        setStats({
          news: statsData?.stats?.news ?? 0,
          media: statsData?.stats?.media ?? 0,
          users: statsData?.stats?.users ?? 0,
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

  const loadAnalytics = useCallback(async (manual = false) => {
    if (manual) setAnalyticsRefreshing(true);
    else setAnalyticsLoading(true);

    try {
      const res = await adminFetch('/api/admin/analytics/realtime', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAnalyticsError(data.error || tx.loadError);
        return;
      }

      setConnected(Boolean(data.connected));
      setSnapshot(data.snapshot ?? EMPTY_SNAPSHOT);
      setAnalyticsError(data.snapshot?.error || '');
    } catch {
      setAnalyticsError(tx.loadError);
    } finally {
      setAnalyticsLoading(false);
      setAnalyticsRefreshing(false);
    }
  }, [tx.loadError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!connected || analyticsError) return undefined;

    const timer = window.setInterval(() => {
      loadAnalytics(true);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [connected, analyticsError, loadAnalytics]);

  useEffect(() => {
    const gaError = searchParams.get('ga_error');
    const gaWarning = searchParams.get('ga_warning');
    if (gaError) {
      setAnalyticsError(`Google Analytics: ${gaError}`);
    } else if (gaWarning === 'property_not_found') {
      setAnalyticsError(tx.propertyMissing);
    }
  }, [searchParams, tx.propertyMissing]);

  return (
    <div className="site-stats-page">
      <div className="site-stats-header">
        <h1>
          <Activity size={20} /> {tx.title}
        </h1>
        <p>{tx.subtitle}</p>
      </div>

      {loading ? (
        <PanelStatsSkeleton count={4} />
      ) : (
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
      )}

      <div className="site-stats-analytics">
        <div className="site-stats-analytics-header">
          <div className="site-stats-analytics-title-wrap">
            <h2>
              <Radio size={18} /> {tx.ga}
            </h2>
            {connected && !analyticsError ? (
              <span className="site-stats-live-badge">{tx.live}</span>
            ) : null}
          </div>
          <div className="site-stats-analytics-actions">
            <button
              type="button"
              className="site-stats-refresh-btn"
              onClick={() => loadAnalytics(true)}
              disabled={analyticsLoading || analyticsRefreshing}
            >
              <RefreshCw size={14} className={analyticsRefreshing ? 'spin' : ''} />
              {tx.refresh}
            </button>
            <a
              href="https://analytics.google.com/analytics/web/"
              target="_blank"
              rel="noreferrer"
              className="site-stats-open-ga"
            >
              <ExternalLink size={14} /> {tx.openGa}
            </a>
          </div>
        </div>

        <p className="site-stats-tracking-note">
          {tx.tracking}: <code>{measurementId}</code>
        </p>

        {analyticsLoading ? (
          <div className="site-stats-analytics-loading wp-skeleton-pulse" aria-hidden />
        ) : connected && !analyticsError ? (
          <>
            <div className="site-stats-realtime-hero">
              <div className="site-stats-realtime-value">{snapshot.activeUsers}</div>
              <div className="site-stats-realtime-label">{tx.activeNow}</div>
              <div className="site-stats-realtime-meta">
                {tx.updated} {formatUpdatedAt(snapshot.updatedAt, locale)}
                {snapshot.propertyId ? ` · GA4 ${snapshot.propertyId}` : ''}
              </div>
            </div>

            <div className="site-stats-breakdown-grid">
              <BreakdownTable title={tx.countries} rows={snapshot.countries} emptyLabel={tx.noData} />
              <BreakdownTable title={tx.pages} rows={snapshot.pages} emptyLabel={tx.noData} />
              <BreakdownTable title={tx.devices} rows={snapshot.devices} emptyLabel={tx.noData} />
              <BreakdownTable title={tx.sources} rows={snapshot.sources} emptyLabel={tx.noData} />
            </div>
          </>
        ) : (
          <div className="site-stats-analytics-empty">
            <p>{analyticsError || tx.notConnected}</p>
            <p>{tx.connectHint.replace('{id}', measurementId)}</p>
            <a href="/api/admin/analytics/connect" className="site-stats-connect-btn">
              <Link2 size={15} /> {tx.connect}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
