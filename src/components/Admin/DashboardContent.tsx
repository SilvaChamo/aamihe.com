'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ImageIcon, 
  Plus, 
  Activity, 
  Clock, 
  Video, 
  FileUp,
  Settings
} from 'lucide-react';
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
          <h1 className="dashboard-title">
            Bem-vindo ao painel de administração
          </h1>
          <p className="dashboard-subtitle">
            Este é o painel de gestão do site AAMIHE.
          </p>
          
          <hr className="dashboard-divider" />
          
          <div className="dashboard-grid">
            <div>
              <h3 className="dashboard-section-title">
                Introdução
              </h3>
              <p className="dashboard-section-text">
                Comece por gerir o conteúdo do site
              </p>
              <Link 
                href="/admin/documentos-gerais" 
                className="dashboard-button"
              >
                Gerir Documentos
              </Link>
            </div>
            
            <div>
              <h3 className="dashboard-section-title">Próximos passos</h3>
              <ul className="dashboard-list">
                <li className="dashboard-list-item"><FileUp /> Rever submissões da conferência</li>
                <li className="dashboard-list-item"><Activity /> Ver estatísticas do site</li>
              </ul>
            </div>

            <div>
              <h3 className="dashboard-section-title">Mais acções</h3>
              <ul className="dashboard-list">
                <li className="dashboard-list-item"><Plus /> Adicionar multimédia</li>
                <li className="dashboard-list-item"><Settings /> Configurações do site</li>
              </ul>
            </div>

            <div className="dashboard-summary-box">
              <h3 className="dashboard-summary-title">
                <Clock />
                Resumo do Site
              </h3>
              <div>
                <div className="dashboard-summary-item">
                  <span className="dashboard-summary-label">Documentos</span>
                  <span className="dashboard-summary-value">{stats.documents}</span>
                </div>
                <div className="dashboard-summary-item">
                  <span className="dashboard-summary-label">Multimédia</span>
                  <span className="dashboard-summary-value">{stats.media}</span>
                </div>
                <div className="dashboard-summary-item">
                  <span className="dashboard-summary-label">Vídeos</span>
                  <span className="dashboard-summary-value">{stats.videos}</span>
                </div>
              </div>
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
                  Actividades Recentes
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
                  <p className="dashboard-no-activity">Nenhuma actividade recente encontrada.</p>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-stats-column">
            <div className="dashboard-stats-grid">
              <Link href="/admin/documentos-gerais" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon blue">
                    <FileUp />
                  </div>
                  <span className="dashboard-stat-value">
                    {stats.documents}
                  </span>
                  <span className="dashboard-stat-label">
                    Documentos
                  </span>
                </div>
              </Link>

              <Link href="/documentos" target="_blank" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon green">
                    <Plus />
                  </div>
                  <span className="dashboard-stat-value">
                    Formulário
                  </span>
                  <span className="dashboard-stat-label">
                    Submissões
                  </span>
                </div>
              </Link>

              <Link href="/admin/media" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon purple">
                    <ImageIcon />
                  </div>
                  <span className="dashboard-stat-value">
                    {stats.media}
                  </span>
                  <span className="dashboard-stat-label">
                    Galeria
                  </span>
                </div>
              </Link>

              <Link href="/admin/media" className="dashboard-stat-link">
                <div className="dashboard-stat-card">
                  <div className="dashboard-stat-icon amber">
                    <Video />
                  </div>
                  <span className="dashboard-stat-value">
                    {stats.videos}
                  </span>
                  <span className="dashboard-stat-label">
                    Vídeos
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
