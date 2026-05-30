'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import { adminFetch } from '@/lib/admin-auth';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import '@/app/(admin)/dashboard/documentos-gerais/documentos-conferencia.css';

type OwnDocument = {
  id: string;
  title_pt: string;
  file_url: string;
  published: boolean;
  created_at: string;
  author?: string;
  email?: string;
};

export default function SubscriberDocumentsPage() {
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const [documents, setDocuments] = useState<OwnDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/documents/mine', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments(data.documents);
      } else {
        setDocuments([]);
      }
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments, refreshKey]);

  const handleSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Documentos</h1>
          <p className="docs-admin-intro">{t.dashboardSubmissionIntro}</p>
        </div>
      </div>

      <div className="docs-admin-container" style={{ marginBottom: 24 }}>
        <ConferenceSubmissionForm
          key={refreshKey}
          labels={t.form}
          onSubmitted={handleSubmitted}
        />
      </div>

      <div className="docs-admin-container">
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1d2327' }}>
          As minhas submissões
        </h2>

        {loading ? (
          <p className="docs-admin-empty">A carregar...</p>
        ) : documents.length === 0 ? (
          <div className="docs-admin-empty-state">
            <FileText size={40} />
            <h2>Nenhuma submissão encontrada</h2>
            <p>Utilize o formulário acima para enviar o resumo da sua apresentação em PDF.</p>
          </div>
        ) : (
          <div className="docs-admin-grid">
            {documents.map((doc) => (
              <article key={doc.id} className="docs-admin-card">
                <div className="docs-admin-card-icon">
                  <FileText size={28} />
                </div>
                <h3>{doc.title_pt}</h3>
                <p className="docs-admin-card-meta">
                  {new Date(doc.created_at).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <span className={`docs-admin-badge ${doc.published ? 'published' : 'pending'}`}>
                  {doc.published ? 'Publicado' : 'Em revisão'}
                </span>
                <div className="docs-admin-card-actions">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="docs-admin-action"
                  >
                    <Download size={14} />
                    Ver PDF
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
