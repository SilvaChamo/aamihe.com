'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Upload } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import '@/app/(admin)/dashboard/documentos-gerais/documentos-conferencia.css';

type OwnDocument = {
  id: string;
  title_pt: string;
  message?: string;
  file_url: string;
  review_comment?: string;
  review_status?: string;
};

export default function SubscriberDocumentEditPage({ id }: { id: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<OwnDocument | null>(null);
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
          <p>A carregar documento…</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="docs-admin-page">
        <p className="docs-admin-empty">Documento não encontrado.</p>
        <Link href="/dashboard/meus-documentos" className="docs-admin-add">
          Voltar aos documentos
        </Link>
      </div>
    );
  }

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Editar documento</h1>
          <p className="docs-admin-intro">
            <Link href="/dashboard/meus-documentos">Documentos</Link> &rsaquo; Editar
          </p>
        </div>
      </div>

      <div className="docs-admin-container">
        {document.review_comment ? (
          <div className="docs-subscriber-feedback docs-subscriber-feedback--edit">
            <strong>Resposta da comissão</strong>
            <p>{document.review_comment}</p>
          </div>
        ) : null}

        <div className="docs-admin-card-preview docs-admin-card-preview--edit">
          <iframe src={`${document.file_url}#toolbar=0&navpanes=0`} title={document.title_pt} />
        </div>

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
                accept="application/pdf,.pdf"
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
