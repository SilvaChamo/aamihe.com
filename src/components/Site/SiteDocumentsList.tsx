'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';

type PublicDocument = {
  id: string;
  title: string;
  file_url: string;
  author?: string;
  year?: string;
};

export default function SiteDocumentsList({ category = 'conferencia' }: { category?: 'conferencia' | 'geral' }) {
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/site-documents?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDocuments(data.documents);
      })
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) return <p>A carregar documentos...</p>;

  if (documents.length === 0) {
    return (
      <div className="docs-empty-state">
        <FileText size={36} />
        <p>Nenhum documento disponível de momento.</p>
      </div>
    );
  }

  return (
    <div className="docs-grid">
      {documents.map((doc) => (
        <article key={doc.id} className="doc-card">
          <div className="doc-icon">
            <FileText size={28} />
          </div>
          <h3 className="doc-title">{doc.title}</h3>
          {(doc.author || doc.year) && (
            <p className="doc-meta">{[doc.author, doc.year].filter(Boolean).join(' · ')}</p>
          )}
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn">
            <Download size={14} style={{ marginRight: 6 }} />
            Download PDF
          </a>
        </article>
      ))}
    </div>
  );
}
