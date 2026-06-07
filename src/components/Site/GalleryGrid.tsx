'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import DocumentFilePreview from '@/components/Admin/DocumentFilePreview';
import type { MediaCategory } from '@/lib/site-media';
import { resolveMediaCategory } from '@/lib/resolve-media-category';
import { normalizeImageSrc } from '@/lib/image-src';
import {
  type GalleryPhotoTab,
  matchesGalleryPhotoTab,
} from '@/lib/gallery-tab-classify';
import { useLanguage } from '@/context/LanguageContext';
import { galleryCopy } from '@/i18n/messages';
import './GalleryGrid.css';

const GALLERY_IMAGE_SIZES =
  '(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 16vw';

const PHOTO_TABS: GalleryPhotoTab[] = [
  'all',
  'graduacao',
  'fotos-direccao',
  'arquivo-1',
  'arquivo-2',
  'eventos',
];

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

function parsePhotoTab(value: string | null): GalleryPhotoTab {
  if (value && PHOTO_TABS.includes(value as GalleryPhotoTab)) {
    return value as GalleryPhotoTab;
  }
  return 'all';
}

function tabLabel(
  tab: GalleryPhotoTab,
  t: (typeof galleryCopy)[keyof typeof galleryCopy],
): string {
  switch (tab) {
    case 'all':
      return t.tabAll;
    case 'graduacao':
      return t.tabGraduacao;
    case 'fotos-direccao':
      return t.tabDireccao;
    case 'arquivo-1':
      return t.tabArquivo1;
    case 'arquivo-2':
      return t.tabArquivo2;
    case 'eventos':
      return t.tabEventos;
    default:
      return t.tabAll;
  }
}

export default function GalleryGrid() {
  const { locale } = useLanguage();
  const t = galleryCopy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo') as MediaCategory | null;
  const initialType =
    tipoParam && ['imagens', 'documentos', 'videos'].includes(tipoParam) ? tipoParam : 'imagens';

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | MediaCategory>(initialType);
  const [photoTab, setPhotoTab] = useState<GalleryPhotoTab>(() =>
    parsePhotoTab(searchParams.get('tab')),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isPhotoGallery = typeFilter === 'imagens';

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
              }) as MediaItem,
          ),
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
    } else if (!tipo) {
      setTypeFilter('imagens');
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeFilter !== 'imagens') return;
    setPhotoTab(parsePhotoTab(searchParams.get('tab')));
  }, [searchParams, typeFilter]);

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
      const matchesTab =
        !isPhotoGallery ||
        kind !== 'imagens' ||
        matchesGalleryPhotoTab(item.url, item.subcategory, photoTab);
      return matchesType && matchesSearch && matchesSubcategory && matchesTab;
    });
  }, [items, typeFilter, searchQuery, subcategoryFilter, isPhotoGallery, photoTab]);

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const photoItems = useMemo(
    () =>
      isPhotoGallery
        ? visibleItems.filter((item) => resolveMediaCategory(item) === 'imagens')
        : [],
    [isPhotoGallery, visibleItems],
  );

  const lightboxItem =
    lightboxIndex !== null && photoItems[lightboxIndex] ? photoItems[lightboxIndex] : null;

  const openLightbox = (item: MediaItem) => {
    const index = photoItems.findIndex((entry) => entry.id === item.id);
    if (index >= 0) setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const showPreviousPhoto = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null || photoItems.length < 2) return current;
      return (current - 1 + photoItems.length) % photoItems.length;
    });
  }, [photoItems.length]);

  const showNextPhoto = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null || photoItems.length < 2) return current;
      return (current + 1) % photoItems.length;
    });
  }, [photoItems.length]);

  useEffect(() => {
    if (lightboxIndex === null) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPreviousPhoto();
      if (event.key === 'ArrowRight') showNextPhoto();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex, closeLightbox, showPreviousPhoto, showNextPhoto]);

  useEffect(() => {
    if (lightboxIndex !== null && lightboxIndex >= photoItems.length) {
      setLightboxIndex(photoItems.length ? photoItems.length - 1 : null);
    }
  }, [lightboxIndex, photoItems.length]);

  const handleTypeChange = (value: 'all' | MediaCategory) => {
    setTypeFilter(value);
    setVisibleCount(PAGE_SIZE);
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'imagens') {
      params.delete('tipo');
    } else {
      params.set('tipo', value);
      params.delete('tab');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const handlePhotoTabChange = (tab: GalleryPhotoTab) => {
    setPhotoTab(tab);
    setVisibleCount(PAGE_SIZE);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tipo');
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="gallery-grid-page">
      {isPhotoGallery ? (
        <div className="gallery-tabs-wrap" role="toolbar" aria-label={t.tabsLabel}>
          <div className="gallery-tabs" role="tablist" aria-label={t.tabsLabel}>
            {PHOTO_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={photoTab === tab}
                className={`gallery-tab${photoTab === tab ? ' gallery-tab--active' : ''}`}
                onClick={() => handlePhotoTabChange(tab)}
              >
                {tabLabel(tab, t)}
              </button>
            ))}
          </div>
          <div className="gallery-toolbar-right gallery-tabs-toolbar-right">
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
      ) : (
        <div className="gallery-toolbar" role="toolbar" aria-label={t.filterType}>
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
      )}

      {loading ? (
        <p className="gallery-empty">{t.loadingGallery}</p>
      ) : filtered.length === 0 ? (
        <p className="gallery-empty">{t.empty}</p>
      ) : (
        <>
          <div
            className={`gallery-items-grid ${
              isPhotoGallery ? 'gallery-items-grid--images gallery-items-grid--photos-only' : ''
            }`}
          >
            {visibleItems.map((item) => {
              const kind = resolveMediaCategory(item);
              const src = normalizeImageSrc(item.url);

              if (isPhotoGallery && kind === 'imagens') {
                return (
                  <article key={item.id} className="gallery-photo-tile">
                    <button
                      type="button"
                      className="gallery-photo-tile-link"
                      aria-label={item.title}
                      onClick={() => openLightbox(item)}
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={item.title}
                          className="gallery-item-image"
                          loading="lazy"
                          decoding="async"
                          sizes={GALLERY_IMAGE_SIZES}
                        />
                      ) : (
                        <div className="gallery-item-placeholder" aria-hidden="true">
                          ?
                        </div>
                      )}
                    </button>
                  </article>
                );
              }

              return (
                <article key={item.id} className="gallery-item-card">
                  <div className="gallery-item-preview">
                    {kind === 'imagens' ? (
                      src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={item.title}
                          className="gallery-item-image"
                          loading="lazy"
                          decoding="async"
                          sizes={GALLERY_IMAGE_SIZES}
                        />
                      ) : (
                        <div className="gallery-item-placeholder" aria-hidden="true">
                          ?
                        </div>
                      )
                    ) : kind === 'videos' ? (
                      <div className="gallery-item-placeholder video">
                        <Play size={28} />
                      </div>
                    ) : (
                      <div className="gallery-item-doc-preview">
                        <DocumentFilePreview
                          url={item.url}
                          title={item.title}
                          mimeType={item.mime_type}
                          layout="card"
                        />
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

      {lightboxItem ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          onClick={closeLightbox}
        >
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={closeLightbox}
              aria-label={t.closePreview}
            >
              <X size={22} />
            </button>

            <div className="gallery-lightbox-outer">
              {photoItems.length > 1 ? (
                <button
                  type="button"
                  className="gallery-lightbox-nav gallery-lightbox-nav--prev"
                  onClick={showPreviousPhoto}
                  aria-label={t.previousImage}
                >
                  <ChevronLeft size={28} />
                </button>
              ) : (
                <span className="gallery-lightbox-nav-spacer" aria-hidden />
              )}

              <div className="gallery-lightbox-frame">
                <div className="gallery-lightbox-viewport">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeImageSrc(lightboxItem.url) || lightboxItem.url}
                    alt={lightboxItem.title}
                    className="gallery-lightbox-image"
                  />
                </div>
                <p className="gallery-lightbox-caption">{lightboxItem.title}</p>
              </div>

              {photoItems.length > 1 ? (
                <button
                  type="button"
                  className="gallery-lightbox-nav gallery-lightbox-nav--next"
                  onClick={showNextPhoto}
                  aria-label={t.nextImage}
                >
                  <ChevronRight size={28} />
                </button>
              ) : (
                <span className="gallery-lightbox-nav-spacer" aria-hidden />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
