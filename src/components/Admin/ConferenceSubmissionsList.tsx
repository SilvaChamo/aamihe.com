'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import {
  getAdminStatusLabel,
  getStatusBadgeClass,
} from '@/lib/document-review';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import '@/app/(admin)/dashboard/documentos-gerais/documentos-conferencia.css';

type ConferenceSubmissionsListProps = {
  viewPath: string;
};

export default function ConferenceSubmissionsList({ viewPath }: ConferenceSubmissionsListProps) {
  const [documents, setDocuments] = useState<SiteDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/documents?category=conferencia', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setDocuments(
          data.documents.sort(
            (a: SiteDocumentRecord, b: SiteDocumentRecord) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta submissão?')) return;
    await adminFetch(`/api/admin/documents?id=${id}`, { method: 'DELETE' });
    loadDocuments();
  };

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Submissões da Conferência</h1>
          <p className="docs-admin-intro">
            Documentos recebidos pelo formulário público. Abra cada documento para aprovar ou devolver com comentário.
          </p>
        </div>
      </div>

      <div className="docs-admin-container">
        {loading ? (
          <p className="docs-admin-empty">A carregar...</p>
        ) : documents.length === 0 ? (
          <div className="docs-admin-empty-state">
            <FileText size={40} />
            <h2>Nenhuma submissão recebida</h2>
            <p>Os documentos enviados pelo formulário aparecerão aqui para revisão.</p>
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
                  {[doc.author, doc.email, doc.year].filter(Boolean).join(' · ')}
                </p>
                <span className={`docs-admin-badge ${getStatusBadgeClass(doc, 'admin')}`}>
                  {getAdminStatusLabel(doc)}
                </span>
                <div className="docs-admin-card-actions">
                  <Link href={`${viewPath}/${doc.id}`} className="docs-admin-action docs-admin-action--primary">
                    <Eye size={14} />
                    Ver documento
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="docs-admin-action danger"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
