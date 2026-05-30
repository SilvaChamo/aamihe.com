'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Play } from 'lucide-react';
import type { MediaCategory } from '@/lib/site-media';
import { resolveMediaCategory } from '@/lib/resolve-media-category';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useLanguage } from '@/context/LanguageContext';
import { galleryCopy } from '@/i18n/messages';
import './GalleryGrid.css';

const GALLERY_IMAGE_SIZES =
  '(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 16vw';

type MediaItem = {
  id: string;
  title: string;
  url: string;
  category: MediaCategory;
  subcategory: string;
  mime_type: string;
};

const PAGE_SIZE = 24;

function buildMediaUrl(typeFilter: 'all' | MediaCategory): string {
  const params = new URLSearchParams();
  if (typeFilter !== 'all') {
    params.set('category', typeFilter);
  }
  const query = params.toString();
  return `/api/public/site-media${query ? `?${query}` : ''}`;
}

export default function GalleryGrid() {
  const { locale } = useLanguage();
  const t = galleryCopy[locale];
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo') as MediaCategory | null;
  const initialType =
    tipoParam && ['imagens', 'documentos', 'videos'].includes(tipoParam) ? tipoParam : 'imagens';

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | MediaCategory>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const typeOptions = useMemo(
    () =>
      [
        { value: 'imagens' as const, label: t.images },
        { value: 'documentos' as const, label: t.documents },
        { value: 'videos' as const, label: t.videos },
        { value: 'all' as const, label: t.allTypes },
      ] satisfies { value: 'all' | MediaCategory; label: string }[],
    [t],
  );

  const subcategoryOptions = useMemo(
    () => [
      { value: '', label: t.allOrigins },
      { value: 'Notícias', label: t.news },
      { value: 'Galeria', label: t.gallery },
    ],
    [t],
  );

  const loadGallery = useCallback(async (filter: 'all' | MediaCategory) => {
    setLoading(true);
    try {
      const res = await fetch(buildMediaUrl(filter), { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setItems(
          data.media.map(
            (item: MediaItem) =>
              ({
                ...item,
                category: resolveMediaCategory(item),
              }) as MediaItem
          )
        );
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Erro ao carregar galeria', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    void loadGallery(typeFilter);
  }, [typeFilter, loadGallery]);

  useEffect(() => {
    const onMediaUpdated = () => void loadGallery(typeFilter);
    window.addEventListener('mediaUpdated', onMediaUpdated);
    return () => window.removeEventListener('mediaUpdated', onMediaUpdated);
  }, [typeFilter, loadGallery]);

  useEffect(() => {
    const tipo = searchParams.get('tipo') as MediaCategory | null;
    if (tipo && ['imagens', 'documentos', 'videos'].includes(tipo)) {
      setTypeFilter(tipo);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const kind = resolveMediaCategory(item);
      const matchesType = typeFilter === 'all' || kind === typeFilter;
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

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const handleTypeChange = (value: 'all' | MediaCategory) => {
    setTypeFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="gallery-grid-page">
      <div className="gallery-toolbar">
        <select
          className="gallery-type-select"
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value as 'all' | MediaCategory)}
          aria-label={t.filterType}
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="gallery-type-select"
          value={subcategoryFilter}
          onChange={(e) => {
            setSubcategoryFilter(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          aria-label={t.filterOrigin}
        >
          {subcategoryOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="gallery-toolbar-right">
          <span className="gallery-count">
            {t.itemsCount(visibleItems.length, filtered.length)}
          </span>
          <input
            type="search"
            className="gallery-search"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </div>
      </div>

      {loading ? (
        <p className="gallery-empty">{t.loadingGallery}</p>
      ) : filtered.length === 0 ? (
        <p className="gallery-empty">{t.empty}</p>
      ) : (
        <>
          <div
            className={`gallery-items-grid ${typeFilter === 'imagens' ? 'gallery-items-grid--images' : ''}`}
          >
            {visibleItems.map((item) => {
              const kind = resolveMediaCategory(item);
              return (
                <article key={item.id} className="gallery-item-card">
                  <div className="gallery-item-preview">
                    {kind === 'imagens' ? (
                      <OptimizedImage
                        src={item.url}
                        alt={item.title}
                        fill
                        className="gallery-item-image"
                        sizes={GALLERY_IMAGE_SIZES}
                        quality={72}
                      />
                    ) : kind === 'videos' ? (
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
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gallery-item-link"
                    >
                      {kind === 'documentos' ? t.openDocument : t.viewFile}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleCount < filtered.length && (
            <div className="gallery-load-more">
              <button
                type="button"
                className="gallery-load-more-btn"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                {t.loadMore(filtered.length - visibleCount)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
