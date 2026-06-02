'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import {
  getAdminStatusLabel,
  getDocumentReviewStatus,
  getStatusBadgeClass,
} from '@/lib/document-review-status';
import {
  getFileTypeLabel,
  getOfficeEmbedPreviewUrl,
  isPdfPreviewable,
  isWordPreviewable,
} from '@/lib/conference-document-files';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import '@/app/(admin)/admin/documentos-gerais/documentos-conferencia.css';

type ConferenceDocumentReviewPageProps = {
  id: string;
  listPath: string;
};

export default function ConferenceDocumentReviewPage({
  id,
  listPath,
}: ConferenceDocumentReviewPageProps) {
  const router = useRouter();
  const [document, setDocument] = useState<SiteDocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [approvalMessage, setApprovalMessage] = useState('');
  const [busy, setBusy] = useState<'approve' | 'revision' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await adminFetch(`/api/admin/documents/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.success) {
            setDocument(data.document);
          } else {
            setDocument(null);
          }
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

  async function submitReview(action: 'approve' | 'request_revision') {
    setError('');
    setSuccess('');

    if (action === 'request_revision' && !comment.trim()) {
      setError('Escreva o comentário para o subscritor.');
      return;
    }

    if (action === 'approve' && !confirm('Confirmar aprovação deste documento?')) {
      return;
    }

    setBusy(action === 'request_revision' ? 'revision' : 'approve');
    try {
      const res = await adminFetch(`/api/admin/documents/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: action === 'approve' ? approvalMessage.trim() : undefined,
          comment: action === 'request_revision' ? comment.trim() : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Não foi possível concluir a revisão.');
        return;
      }

      setDocument(data.document);
      setComment('');
      setApprovalMessage('');
      setSuccess(
        action === 'approve'
          ? 'Documento aprovado. Notificação no painel enviada ao subscritor.'
          : 'Documento devolvido. Notificação no painel enviada ao subscritor.',
      );
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="docs-admin-page">
        <div className="docs-admin-empty">
          <Loader2 className="wp-spin" size={28} aria-hidden />
          <p>A carregar documento…</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="docs-admin-page">
        <p className="docs-admin-empty">Documento não encontrado.</p>
        <Link href={listPath} className="docs-admin-add">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const status = getDocumentReviewStatus(document);
  const badgeClass = getStatusBadgeClass(document, 'admin');
  const canPreviewPdf = isPdfPreviewable(document.file_url, document.mime_type);
  const canPreviewWord = isWordPreviewable(document.file_url, document.mime_type);
  const officePreviewUrl = canPreviewWord ? getOfficeEmbedPreviewUrl(document.file_url) : '';

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">{document.title_pt}</h1>
          <p className="docs-admin-intro">
            {[document.author, document.email, document.year].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className={`docs-admin-badge ${badgeClass}`}>{getAdminStatusLabel(document)}</span>
      </div>

      <div className="docs-review-layout">
        <div className="docs-review-reader">
          {canPreviewPdf ? (
            <iframe
              src={`${document.file_url}#toolbar=1&navpanes=0&view=FitH`}
              title={document.title_pt}
            />
          ) : canPreviewWord ? (
            <iframe src={officePreviewUrl} title={`${document.title_pt} (Word)`} />
          ) : (
            <div className="docs-review-file-fallback">
              <p>
                Pré-visualização indisponível para ficheiros{' '}
                <strong>{getFileTypeLabel(document.file_url)}</strong>.
              </p>
              <a href={document.file_url} target="_blank" rel="noopener noreferrer" className="docs-admin-add">
                Descarregar documento
              </a>
            </div>
          )}
        </div>

        <aside className="docs-review-panel">
          <section className="docs-review-section">
            <h2>Detalhes</h2>
            <dl className="docs-review-meta">
              <div>
                <dt>Enviado em</dt>
                <dd>
                  {new Date(document.created_at).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              {document.message ? (
                <div>
                  <dt>Mensagem do subscritor</dt>
                  <dd>{document.message}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {document.review_comment ? (
            <section className="docs-review-section docs-review-feedback">
              <h2>Comentário enviado</h2>
              <p>{document.review_comment}</p>
              {document.review_comment_at ? (
                <time dateTime={document.review_comment_at}>
                  {new Date(document.review_comment_at).toLocaleDateString('pt-PT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              ) : null}
            </section>
          ) : null}

          {error ? <p className="docs-review-error">{error}</p> : null}
          {success ? <p className="docs-review-success">{success}</p> : null}

          {status !== 'approved' ? (
            <section className="docs-review-section">
              <h2>Decisão</h2>

              <div className="docs-review-revision">
                <label htmlFor="approval-message">Mensagem de aprovação (opcional)</label>
                <textarea
                  id="approval-message"
                  rows={3}
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  placeholder="Confirme a aprovação e adicione observações para o subscritor…"
                />
              </div>

              <button
                type="button"
                className="aamihe-btn aamihe-btn--primary docs-review-approve"
                disabled={busy !== null}
                onClick={() => submitReview('approve')}
              >
                <CheckCircle2 size={18} />
                {busy === 'approve' ? 'A aprovar…' : 'Confirmar aprovação'}
              </button>

              <div className="docs-review-revision">
                <label htmlFor="review-comment">Devolver com comentário</label>
                <textarea
                  id="review-comment"
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explique o que o subscritor deve corrigir ou melhorar…"
                />
                <button
                  type="button"
                  className="aamihe-btn aamihe-btn--secondary docs-review-return"
                  disabled={busy !== null}
                  onClick={() => submitReview('request_revision')}
                >
                  <RotateCcw size={16} />
                  {busy === 'revision' ? 'A enviar…' : 'Devolver ao subscritor'}
                </button>
              </div>
            </section>
          ) : (
            <section className="docs-review-section">
              <p className="docs-review-approved-note">Documento aprovado e publicado.</p>
              <button
                type="button"
                className="docs-admin-action"
                onClick={() => router.push(listPath)}
              >
                Voltar à lista
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
