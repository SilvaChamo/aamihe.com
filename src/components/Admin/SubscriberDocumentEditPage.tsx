'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, Upload } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import { useSubscriberNotifications } from '@/hooks/useSubscriberNotifications';
import DocumentFilePreview from '@/components/Admin/DocumentFilePreview';
import { CONFERENCE_FILE_ACCEPT } from '@/lib/conference-document-files';
import {
  getDocumentReviewStatus,
  getStatusBadgeClass,
  getSubscriberStatusLabel,
} from '@/lib/document-review-status';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import '@/app/(admin)/admin/documentos-gerais/documentos-conferencia.css';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SubscriberDocumentEditPage({ id }: { id: string }) {
  const router = useRouter();
  const { markReadForDocument } = useSubscriberNotifications();
  const [document, setDocument] = useState<SiteDocumentRecord | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await adminFetch(`/api/admin/documents/mine/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (!cancelled) setDocument(null);
          return;
        }
        if (!cancelled) {
          setDocument(data.document);
          setTitle(data.document.title_pt || '');
          setMessage(data.document.message || '');
        }
      } catch {
        if (!cancelled) setDocument(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && document) {
      void markReadForDocument(id);
    }
  }, [loading, document, id, markReadForDocument]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await adminFetch(`/api/admin/documents/mine/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Não foi possível guardar as alterações.');
        return;
      }
      router.push('/dashboard/meus-documentos');
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="docs-admin-page">
        <div className="docs-admin-empty">
          <Loader2 className="wp-spin" size={28} aria-hidden />
          <p>A carregar resumo…</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="docs-admin-page">
        <p className="docs-admin-empty">Resumo não encontrado.</p>
        <Link href="/dashboard/meus-documentos" className="docs-admin-add">
          Voltar aos resumos
        </Link>
      </div>
    );
  }

  const badgeClass = getStatusBadgeClass(document, 'subscriber');

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Editar resumo</h1>
          <p className="docs-admin-intro">
            <Link href="/dashboard/meus-documentos">Resumos</Link> &rsaquo; Editar
          </p>
        </div>
      </div>

      <div className="docs-admin-container docs-edit-form-wrap">
        {document.review_comment ? (
          <div className="docs-subscriber-feedback docs-subscriber-feedback--edit">
            <strong>Resposta da comissão</strong>
            <p>{document.review_comment}</p>
          </div>
        ) : null}

        <article className="docs-subscriber-card docs-edit-summary-card">
          <div className="docs-subscriber-card-thumb">
            <DocumentFilePreview url={document.file_url} title={document.title_pt} mimeType={document.mime_type} />
            <div className="docs-subscriber-card-hover">
              <div className="docs-subscriber-card-actions-minimal">
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-subscriber-icon-btn"
                  title="Ver PDF"
                >
                  <Eye size={14} />
                </a>
              </div>
            </div>
          </div>
          <div className="docs-subscriber-card-base">
            <h3>{document.title_pt}</h3>
            <div className="docs-subscriber-card-meta-row">
              <p className="docs-subscriber-card-date">{formatDate(document.created_at)}</p>
              <span className={`docs-admin-badge ${badgeClass}`}>
                {getSubscriberStatusLabel(document)}
              </span>
            </div>
          </div>
        </article>

        <h2 className="docs-edit-section-title">Detalhes do envio</h2>

        <form className="subscriber-doc-edit-form" onSubmit={handleSubmit}>
          {error ? <p className="conference-form-error">{error}</p> : null}

          <label>
            Título
            <input type="text" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          <label>
            Mensagem
            <textarea name="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>

          <label>
            Substituir PDF (opcional)
            <div className="subscriber-doc-upload-box">
              <Upload size={18} />
              <input
                type="file"
                name="file"
                accept={CONFERENCE_FILE_ACCEPT}
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
              <span>{fileName || 'Seleccionar novo PDF'}</span>
            </div>
          </label>

          <div className="docs-admin-card-actions">
            <button type="submit" className="docs-admin-add" disabled={saving} style={{ border: 'none' }}>
              {saving ? 'A guardar…' : 'Guardar alterações'}
            </button>
            <Link href="/dashboard/meus-documentos" className="docs-admin-action">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
