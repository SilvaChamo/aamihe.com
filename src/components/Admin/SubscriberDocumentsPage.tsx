'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
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

function fileTypeLabel(url: string) {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  return ext?.toUpperCase() || 'DOC';
}

export default function SubscriberDocumentsPage() {
  const [documents, setDocuments] = useState<OwnDocument[]>([]);
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
          <div className="docs-admin-grid">
            {documents.map((doc) => (
              <article key={doc.id} className="docs-admin-card docs-admin-card--with-preview">
                <div className="docs-admin-card-preview">
                  <iframe
                    src={`${doc.file_url}#toolbar=0&navpanes=0&view=FitH`}
                    title={`Pré-visualização — ${doc.title_pt}`}
                    loading="lazy"
                  />
                </div>
                <h3>{doc.title_pt}</h3>
                <p className="docs-admin-card-meta">
                  {new Date(doc.created_at).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <span className={`docs-admin-badge ${doc.published ? 'published' : 'sent'}`}>
                  {doc.published ? 'Publicado' : 'Enviado'}
                </span>
                <div className="docs-admin-card-actions">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="docs-admin-action"
                  >
                    <Eye size={14} />
                    Ver ({fileTypeLabel(doc.file_url)})
                  </a>
                  <Link
                    href={`/dashboard/meus-documentos/editar/${doc.id}`}
                    className="docs-admin-action"
                  >
                    <Pencil size={14} />
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="docs-admin-action danger"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id, doc.title_pt)}
                  >
                    <Trash2 size={14} />
                    {deletingId === doc.id ? 'A eliminar…' : 'Eliminar'}
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
