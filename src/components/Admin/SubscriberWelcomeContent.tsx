'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, FileUp, Settings, UserCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import { useSessionUser } from '@/hooks/useSessionUser';
import './DashboardContent.css';

type OwnDocument = {
  id: string;
  title_pt: string;
  created_at: string;
  published: boolean;
};

export default function SubscriberWelcomeContent() {
  const { user, loading: sessionLoading } = useSessionUser();
  const [documents, setDocuments] = React.useState<OwnDocument[]>([]);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const displayName = user?.firstName || user?.username || 'participante';

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await adminFetch('/api/admin/documents/mine', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setDocuments(data.documents);
        }
      } catch {
        if (!cancelled) setDocuments([]);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const recentActivities = documents.slice(0, 4).map((doc) => ({
    id: doc.id,
    title: doc.title_pt,
    date: doc.created_at,
  }));

  if (sessionLoading) {
    return <div className="dashboard-container"><p className="dashboard-no-activity">A carregar…</p></div>;
  }

  return (
    <div className="dashboard-container">
      <section className="dashboard-welcome-section">
        <div className="dashboard-content">
          <div className="dashboard-welcome-soft-box">
            <h1 className="dashboard-title">Bem-vindo, {displayName}</h1>
            <p className="dashboard-subtitle">
              Área reservada aos participantes da conferência AAMIHE. Submeta o resumo da sua
              apresentação, consulte os seus documentos e gerir a sua conta.
            </p>
          </div>

          <div className="dashboard-grid">
            <div>
              <h3 className="dashboard-section-title">Introdução</h3>
              <Link href="/dashboard/meus-documentos" className="dashboard-button">
                Submeter resumo
              </Link>
            </div>

            <div>
              <h3 className="dashboard-section-title">Próximos passos</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href="/dashboard/meus-documentos" className="dashboard-list-item">
                    <FileUp /> Ver os meus documentos
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/minha-conta" className="dashboard-list-item">
                    <UserCircle /> Consultar minha conta
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="dashboard-section-title">Mais acções</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href="/dashboard/definicoes-conta" className="dashboard-list-item">
                    <Settings /> Definições da conta
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="dashboard-summary-title">Conferência AAMIHE</h3>
              <ul className="dashboard-list">
                <li>
                  <Link href="/conferencia" className="dashboard-list-item">
                    <Activity /> Página da conferência
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/meus-documentos" className="dashboard-list-item">
                    <FileUp /> Submissão de resumo
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
                  Actividades recentes
                </h2>
              </div>
              <div className="dashboard-card-body">
                {recentActivities.length > 0 ? (
                  <ul className="dashboard-activity-list">
                    {recentActivities.map((activity) => (
                      <li key={activity.id} className="dashboard-activity-item">
                        <p className="dashboard-activity-date">
                          {new Date(activity.date).toLocaleDateString('pt-PT', {
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
                  <p className="dashboard-no-activity">Nenhuma actividade recente encontrada.</p>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-stats-column">
            <div className="dashboard-stats-grid">
              <Link href="/dashboard/meus-documentos" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon blue">
                    <FileUp />
                  </div>
                  <span className="dashboard-stat-value">
                    {statsLoading ? '...' : documents.length}
                  </span>
                  <span className="dashboard-stat-label">Documentos</span>
                </div>
              </Link>

              <Link href="/dashboard/meus-documentos" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon green">
                    <FileUp />
                  </div>
                  <span className="dashboard-stat-value">
                    {statsLoading ? '...' : documents.filter((d) => !d.published).length}
                  </span>
                  <span className="dashboard-stat-label">Em revisão</span>
                </div>
              </Link>

              <Link href="/dashboard/minha-conta" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon purple">
                    <UserCircle />
                  </div>
                  <span className="dashboard-stat-value">1</span>
                  <span className="dashboard-stat-label">Conta</span>
                </div>
              </Link>

              <Link href="/dashboard/definicoes-conta" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon amber">
                    <Settings />
                  </div>
                  <span className="dashboard-stat-value">—</span>
                  <span className="dashboard-stat-label">Definições</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
