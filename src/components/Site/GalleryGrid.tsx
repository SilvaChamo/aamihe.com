'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Play } from 'lucide-react';
import type { MediaCategory } from '@/lib/site-media';
import './GalleryGrid.css';

type MediaItem = {
  id: string;
  title: string;
  url: string;
  category: MediaCategory;
  subcategory: string;
  mime_type: string;
};

const TYPE_OPTIONS: { value: 'all' | MediaCategory; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'imagens', label: 'Imagens' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'videos', label: 'Vídeos' },
];

export default function GalleryGrid() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('tipo') as MediaCategory | 'all' | null) || 'all';
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | MediaCategory>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/public/site-media')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.media);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const tipo = searchParams.get('tipo') as MediaCategory | null;
    if (tipo && ['imagens', 'documentos', 'videos'].includes(tipo)) {
      setTypeFilter(tipo);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesType = typeFilter === 'all' || item.category === typeFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subcategory.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [items, typeFilter, searchQuery]);

  return (
    <div className="gallery-grid-page">
      <div className="gallery-toolbar">
        <select
          className="gallery-type-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | MediaCategory)}
          aria-label="Filtrar por tipo"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="gallery-toolbar-right">
          <span className="gallery-count">{filtered.length} itens</span>
          <input
            type="search"
            className="gallery-search"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="gallery-empty">A carregar galeria...</p>
      ) : filtered.length === 0 ? (
        <p className="gallery-empty">Nenhum conteúdo encontrado.</p>
      ) : (
        <div className="gallery-items-grid">
          {filtered.map((item) => (
            <article key={item.id} className="gallery-item-card">
              <div className="gallery-item-preview">
                {item.category === 'imagens' ? (
                  <img src={item.url} alt={item.title} loading="lazy" />
                ) : item.category === 'videos' ? (
                  <div className="gallery-item-placeholder video">
                    <Play size={28} />
                  </div>
                ) : (
                  <div className="gallery-item-placeholder document">
                    <FileText size={28} />
                  </div>
                )}
              </div>
              <div className="gallery-item-body">
                <h3>{item.title}</h3>
                <p>{item.subcategory}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="gallery-item-link">
                  {item.category === 'documentos' ? 'Abrir documento' : 'Ver ficheiro'}
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
