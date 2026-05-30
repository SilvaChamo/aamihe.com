'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import {
  getDocumentReviewStatus,
  getStatusBadgeClass,
  getSubscriberStatusLabel,
} from '@/lib/document-review';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import '@/app/(admin)/dashboard/documentos-gerais/documentos-conferencia.css';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SubscriberDocumentsPage() {
  const [documents, setDocuments] = useState<SiteDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  }, [loadDocuments]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Eliminar «${title}»? Esta acção não pode ser desfeita.`)) return;

    setDeletingId(id);
    try {
      const res = await adminFetch(`/api/admin/documents/mine/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } else {
        alert(data.error || 'Não foi possível eliminar o documento.');
      }
    } catch {
      alert('Erro de ligação. Tente novamente.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Documentos</h1>
          <p className="docs-admin-intro">
            Consulte e gira as submissões que enviou para a conferência.
          </p>
        </div>
        <Link href="/dashboard/meus-documentos/novo" className="docs-admin-add">
          <Plus size={16} />
          Enviar documento
        </Link>
      </div>

      <div className="docs-admin-container">
        {loading ? (
          <p className="docs-admin-empty">A carregar...</p>
        ) : documents.length === 0 ? (
          <div className="docs-admin-empty-state">
            <FileText size={40} />
            <h2>Nenhuma submissão encontrada</h2>
            <p>
              Ainda não enviou nenhum documento. Clique em «Enviar documento» para submeter o
              resumo da sua apresentação em PDF.
            </p>
          </div>
        ) : (
          <div className="docs-subscriber-grid">
            {documents.map((doc) => {
              const status = getDocumentReviewStatus(doc);
              const badgeClass = getStatusBadgeClass(doc, 'subscriber');

              return (
                <div key={doc.id} className="docs-subscriber-wrap">
                  <article className="docs-subscriber-card">
                    <div className="docs-subscriber-card-base">
                      <h3>{doc.title_pt}</h3>
                      <p className="docs-subscriber-card-date">{formatDate(doc.created_at)}</p>
                      <span className={`docs-admin-badge ${badgeClass}`}>
                        {getSubscriberStatusLabel(doc)}
                      </span>
                    </div>

                    <div className="docs-subscriber-card-hover">
                      <div className="docs-subscriber-card-hover-info">
                        <strong>{doc.title_pt}</strong>
                        <span>{formatDate(doc.created_at)}</span>
                        {doc.message ? <p>{doc.message}</p> : null}
                      </div>
                      <div className="docs-subscriber-card-actions-minimal">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="docs-subscriber-icon-btn"
                          title="Ver PDF"
                        >
                          <Eye size={14} />
                        </a>
                        <Link
                          href={`/dashboard/meus-documentos/editar/${doc.id}`}
                          className="docs-subscriber-icon-btn"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          className="docs-subscriber-icon-btn docs-subscriber-icon-btn--danger"
                          title="Eliminar"
                          disabled={deletingId === doc.id}
                          onClick={() => handleDelete(doc.id, doc.title_pt)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>

                  {status === 'revision_requested' && doc.review_comment ? (
                    <div className="docs-subscriber-feedback">
                      <strong>Resposta da comissão</strong>
                      <p>{doc.review_comment}</p>
                      <Link href={`/dashboard/meus-documentos/editar/${doc.id}`}>
                        Editar e reenviar
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
