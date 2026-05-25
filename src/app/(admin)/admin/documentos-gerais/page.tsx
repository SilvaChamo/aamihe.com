'use client';

import { useEffect, useState } from 'react';
import { FileText, Trash2, Download, Eye, EyeOff } from 'lucide-react';
import './documentos-conferencia.css';

type ConferenceDocument = {
  id: string;
  title_pt: string;
  file_url: string;
  language: string;
  author?: string;
  email?: string;
  year?: string;
  published: boolean;
  source?: string;
  created_at: string;
};

export default function AdminDocumentosConferenciaPage() {
  const [documents, setDocuments] = useState<ConferenceDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/documents?category=conferencia');
      const data = await res.json();
      if (data.success) {
        setDocuments(
          data.documents.sort(
            (a: ConferenceDocument, b: ConferenceDocument) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
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

  const togglePublish = async (doc: ConferenceDocument) => {
    await fetch('/api/admin/documents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, published: !doc.published }),
    });
    loadDocuments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta submissão?')) return;
    await fetch(`/api/admin/documents?id=${id}`, { method: 'DELETE' });
    loadDocuments();
  };

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Submissões da Conferência</h1>
          <p className="docs-admin-intro">
            Documentos recebidos pelo formulário público. Aprove ou remova antes de aparecerem no site.
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
            <p>Os documentos enviados pelo formulário em /documentos aparecerão aqui para revisão.</p>
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
                <span className={`docs-admin-badge ${doc.published ? 'published' : 'pending'}`}>
                  {doc.published ? 'Publicado' : 'Pendente'}
                </span>
                <div className="docs-admin-card-actions">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="docs-admin-action">
                    <Download size={14} />
                    Ver PDF
                  </a>
                  <button type="button" onClick={() => togglePublish(doc)} className="docs-admin-action">
                    {doc.published ? <EyeOff size={14} /> : <Eye size={14} />}
                    {doc.published ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button type="button" onClick={() => handleDelete(doc.id)} className="docs-admin-action danger">
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
