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

const SUBCATEGORY_OPTIONS = [
  { value: '', label: 'Todas as origens' },
  { value: 'Notícias', label: 'Notícias' },
  { value: 'Galeria', label: 'Galeria' },
];

export default function GalleryGrid() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('tipo') as MediaCategory | 'all' | null) || 'all';
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | MediaCategory>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');

  const loadGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/site-media?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setItems(data.media);
      }
    } catch (err) {
      console.error('Erro ao carregar galeria', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
    const onMediaUpdated = () => loadGallery();
    window.addEventListener('mediaUpdated', onMediaUpdated);
    return () => window.removeEventListener('mediaUpdated', onMediaUpdated);
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
      const matchesSubcategory =
        !subcategoryFilter || item.subcategory === subcategoryFilter;
      return matchesType && matchesSearch && matchesSubcategory;
    });
  }, [items, typeFilter, searchQuery, subcategoryFilter]);

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

        <select
          className="gallery-type-select"
          value={subcategoryFilter}
          onChange={(e) => setSubcategoryFilter(e.target.value)}
          aria-label="Filtrar por origem"
        >
          {SUBCATEGORY_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
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
