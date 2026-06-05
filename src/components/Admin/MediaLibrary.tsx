'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { adminFetch } from '@/lib/admin-auth';
import { uploadMediaFiles } from '@/lib/persist-client-media';
import { canDeleteMedia, dedupeMediaRecords, mediaCatalogKey } from '@/lib/media-catalog-key';
import { normalizeImageSrc } from '@/lib/image-src';
import type { SiteMediaRecord } from '@/lib/site-media';
import { 
  Trash2, 
  Copy, 
  ExternalLink, 
  ImageIcon, 
  Upload, 
  X,
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  Check,
  Plus,
  FileDown,
  Edit3,
  Video,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { MediaCategory } from '@/lib/site-media';
import { resolveMediaCategory } from '@/lib/resolve-media-category';
import { SkeletonMediaGrid } from '@/components/Admin/Skeleton';
import { dispatchMediaUpdated } from '@/lib/media-events';
import './MediaLibrary.css';

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  isModal?: boolean;
  externalSearchQuery?: string;
  /** Galeria pública: inclui ficheiros em /gallery e arquivo legado */
  fullCatalog?: boolean;
  /** Filtro inicial nas páginas Biblioteca / Documentos / Vídeos */
  initialCategory?: MediaCategory;
}

interface MediaFile {
  id: string;
  name: string;
  url: string;
  category: MediaCategory;
  subcategory: string;
  source?: string;
  metadata?: {
    size: number;
    mimetype: string;
  } | null;
  created_at?: string;
  alt_text?: string;
  caption?: string;
  description?: string;
}

const TYPE_FILTERS: { value: 'all' | MediaCategory; label: string }[] = [
  { value: 'imagens', label: 'Imagens' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'videos', label: 'Vídeos' },
  { value: 'all', label: 'Todos' },
];

/** 7 colunas × 7 linhas por página da grelha */
const PAGE_BATCH = 49;

export default function MediaLibrary({
  onSelect,
  isModal,
  externalSearchQuery,
  fullCatalog,
  initialCategory,
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const defaultFilter: 'all' | MediaCategory =
    initialCategory ?? (isModal ? 'all' : 'imagens');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaCategory>(defaultFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH);
  
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editWidth, setEditWidth] = useState(0);
  const [editHeight, setEditHeight] = useState(0);
  const [editFormat, setEditFormat] = useState<'original' | 'webp' | 'jpeg'>('original');
  const [processingImage, setProcessingImage] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{
    width: number;
    height: number;
    format: 'original' | 'webp' | 'jpeg';
  } | null>(null);
  const [saveMode, setSaveMode] = useState<'replace' | 'new'>('replace');
  
  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<MediaFile | null>(null);
  
  // Metadata States
  const [metadata, setMetadata] = useState({
    alt_text: '',
    title: '',
    caption: '',
    description: ''
  });
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const originalImageDimensions = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();

    const onChange = () => updateViewport();
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  const loadImages = async (filter: 'all' | MediaCategory = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('category', filter);

      const query = params.toString();
      const res = await fetch(`/api/admin/media${query ? `?${query}` : ''}`);
      const data = await res.json();
      if (data.success) {
        const records = data.media as SiteMediaRecord[];
        const deduped = dedupeMediaRecords(records);
        const mapped = deduped.map((item) => ({
          id: item.id,
          name: item.title,
          url: item.url,
          category: resolveMediaCategory(item),
          subcategory: item.subcategory,
          source: item.source,
          metadata: {
            size: item.size || 0,
            mimetype: item.mime_type,
          },
          created_at: item.created_at,
          alt_text: item.alt_text,
          caption: item.caption,
          description: item.description,
        }));
        setFiles(mapped);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setVisibleCount(PAGE_BATCH);
    setActiveFile(null);
    void loadImages(typeFilter);
  }, [typeFilter, fullCatalog]);

  useEffect(() => {
    const onMediaUpdated = () => void loadImages(typeFilter);
    window.addEventListener('mediaUpdated', onMediaUpdated);
    return () => window.removeEventListener('mediaUpdated', onMediaUpdated);
  }, [typeFilter, fullCatalog]);

  useEffect(() => {
    if (!isEditingImage || !activeFile) {
      setEstimatedSize(null);
      return;
    }
    const { width: origW, height: origH } = originalImageDimensions.current;
    if (!origW || !origH) return;
    const baseSize = activeFile.metadata?.size || 0;
    const scale = (editWidth * editHeight) / (origW * origH);
    let est = baseSize * scale;
    if (editFormat === 'webp') est *= 0.72;
    else if (editFormat === 'jpeg') est *= 0.95;
    setEstimatedSize(est > 0 ? est : null);
  }, [isEditingImage, activeFile, editWidth, editHeight, editFormat]);

  const filteredFiles = useMemo(() => {
    const query = (externalSearchQuery || searchQuery).toLowerCase();
    return files.filter((f) => {
      const kind = resolveMediaCategory({
        category: f.category,
        mime_type: f.metadata?.mimetype,
        url: f.url,
      });
      if (isModal && onSelect && kind !== 'imagens') return false;
      const matchesType = typeFilter === 'all' || kind === typeFilter;
      const matchesSearch =
        !query ||
        f.name.toLowerCase().includes(query) ||
        f.subcategory.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [files, searchQuery, externalSearchQuery, typeFilter, isModal, onSelect]);

  const paginatedFiles = useMemo(() => {
    return filteredFiles.slice(0, visibleCount);
  }, [filteredFiles, visibleCount]);

  const previewGalleryImages = useMemo(
    () =>
      filteredFiles.filter(
        (f) =>
          resolveMediaCategory({
            category: f.category,
            mime_type: f.metadata?.mimetype,
            url: f.url,
          }) === 'imagens',
      ),
    [filteredFiles],
  );

  const isSameMediaFile = (a: MediaFile, b: MediaFile) =>
    a.id === b.id || mediaCatalogKey(a.url) === mediaCatalogKey(b.url);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const getPublicUrl = (file: MediaFile) => {
    const url = file.url?.trim() || '';
    return normalizeImageSrc(url) || url;
  };

  const fileDisplayKind = (file: MediaFile) =>
    resolveMediaCategory({
      category: file.category,
      mime_type: file.metadata?.mimetype,
      url: file.url,
    });

  const openDetails = async (file: MediaFile, startEditing = false) => {
    setActiveFile(file);
    setIsEditingImage(startEditing && fileDisplayKind(file) === 'imagens');

    if (fileDisplayKind(file) === 'imagens') {
      const img = new Image();
      img.src = getPublicUrl(file);
      img.onload = () => {
        originalImageDimensions.current = { width: img.width, height: img.height };
        setEditWidth(img.width);
        setEditHeight(img.height);
      };
    }
    
    // Set default metadata
    setMetadata({
      alt_text: file.alt_text || '',
      title: file.name,
      caption: file.caption || '',
      description: file.description || '',
    });
  };

  const openPreview = (file: MediaFile) => {
    setPreviewImage(file);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewImage(null);
  };

  const previewImageIndex = previewImage
    ? previewGalleryImages.findIndex((f) => isSameMediaFile(f, previewImage))
    : -1;

  const shiftPreviewImage = (delta: number) => {
    if (!previewImage || previewGalleryImages.length < 2) return;
    const idx = previewImageIndex >= 0 ? previewImageIndex : 0;
    const next = previewGalleryImages[idx + delta];
    if (next) setPreviewImage(next);
  };

  const openEditFromPreview = (file: MediaFile) => {
    closePreview();
    void openDetails(file, true);
  };

  const handlePrimaryItemClick = (file: MediaFile) => {
    if (isBulkMode) {
      toggleSelect(file.id);
      return;
    }
    if (isModal && onSelect) {
      const kind = resolveMediaCategory({
        category: file.category,
        mime_type: file.metadata?.mimetype,
        url: file.url,
      });
      if (kind === 'imagens') {
        onSelect(getPublicUrl(file));
      }
      return;
    }
    if (fileDisplayKind(file) === 'imagens') {
      openPreview(file);
      return;
    }
    void openDetails(file);
  };

  const closeAttachmentDetails = () => {
    setActiveFile(null);
    setIsEditingImage(false);
  };

  const saveMetadata = async () => {
    if (!activeFile) return;
    setSavingMetadata(true);
    try {
      const res = await adminFetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeFile.id,
          url: activeFile.url,
          title: metadata.title,
          alt_text: metadata.alt_text,
          caption: metadata.caption,
          description: metadata.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao guardar metadados');
      }
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id && f.url === activeFile.url
            ? {
                ...f,
                name: metadata.title || f.name,
                alt_text: metadata.alt_text,
                caption: metadata.caption,
                description: metadata.description,
              }
            : f
        )
      );
      dispatchMediaUpdated();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao guardar metadados');
    } finally {
      setSavingMetadata(false);
    }
  };

  const requestDelete = async (items: MediaFile[]) => {
    if (items.length === 1) {
      const item = items[0];
      const res = await adminFetch(
        `/api/admin/media?id=${encodeURIComponent(item.id)}&url=${encodeURIComponent(item.url)}`,
        { method: 'DELETE' },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao eliminar');
      }
      return;
    }

    const res = await adminFetch('/api/admin/media/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((file) => ({ id: file.id, url: file.url })),
      }),
    });
    const data = await res.json();
    if (!res.ok || Number(data.deleted) === 0) {
      throw new Error(data.error || 'Erro ao eliminar em massa');
    }
    if (Array.isArray(data.failed) && data.failed.length > 0) {
      alert(
        `${data.deleted} eliminado(s). ${data.failed.length} item(ns) não foi/foram eliminado(s) (arquivo legado ou erro).`
      );
    }
  };

  const removeDeletedFromState = (deleted: MediaFile[]) => {
    const keys = new Set(deleted.map((f) => mediaCatalogKey(f.url)));
    const ids = new Set(deleted.map((f) => f.id));
    setFiles((prev) => prev.filter((f) => !ids.has(f.id) && !keys.has(mediaCatalogKey(f.url))));
  };

  const deleteSingle = async (file: MediaFile) => {
    if (!canDeleteMedia(file)) {
      alert('Este item do arquivo legado não pode ser eliminado aqui.');
      return;
    }
    if (!confirm('Eliminar este item permanentemente?')) return;
    const closeEditor = activeFile ? isSameMediaFile(activeFile, file) : false;
    const closePreviewModal = previewImage ? isSameMediaFile(previewImage, file) : false;
    setLoading(true);
    try {
      await requestDelete([file]);
      removeDeletedFromState([file]);
      if (closeEditor) closeAttachmentDetails();
      if (closePreviewModal) closePreview();
      dispatchMediaUpdated();
      await loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao eliminar');
    } finally {
      setLoading(false);
    }
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const selectedFiles = files.filter((f) => ids.includes(f.id));
    if (!selectedFiles.length) {
      alert('Nenhum item seleccionado para eliminar.');
      return;
    }
    if (!confirm(`Eliminar ${selectedFiles.length} item(ns)?`)) {
      return;
    }
    setLoading(true);
    try {
      await requestDelete(selectedFiles);
      removeDeletedFromState(selectedFiles);
      setSelectedIds(new Set());
      setIsBulkMode(false);
      await loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao eliminar em massa');
      await loadImages();
    } finally {
      setLoading(false);
    }
  };

  const applyImageEdits = () => {
    if (!activeFile) return;
    if (!editWidth || !editHeight) {
      alert('Indique largura e altura válidas.');
      return;
    }
    setSaveMode('replace');
    setPendingEdit({ width: editWidth, height: editHeight, format: editFormat });
    setIsSaveConfirmOpen(true);
  };

  const closeSaveConfirm = () => {
    setIsSaveConfirmOpen(false);
    setPendingEdit(null);
  };

  const submitSaveConfirm = () => {
    void confirmSave(saveMode === 'replace');
  };

  const confirmSave = async (replace: boolean) => {
    if (!activeFile || !pendingEdit) return;
    setProcessingImage(true);

    try {
      const res = await fetch('/api/admin/media/edit', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeFile.id,
          url: activeFile.url,
          width: pendingEdit.width,
          height: pendingEdit.height,
          format: pendingEdit.format,
          replace,
          fileName: activeFile.name,
          title: metadata.title,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const msg = data.error || 'Erro ao guardar imagem';
        throw new Error(
          msg.includes('eliminar') ? 'Não foi possível guardar a imagem. Tente «Guardar como novo».' : msg
        );
      }

      setIsSaveConfirmOpen(false);
      setPendingEdit(null);
      setIsEditingImage(false);
      closeAttachmentDetails();
      dispatchMediaUpdated();
      await loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleToolbarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const filesToUpload = Array.from(list);
    setIsUploading(true);
    try {
      await uploadMediaFiles(filesToUpload, 'Upload');
      await loadImages();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao carregar ficheiros. Tente novamente.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const runCatalogCleanup = async () => {
    if (
      !confirm(
        'Limpar duplicados na base de dados?\n\nMantém uma entrada por foto (alinhada aos ficheiros em /gallery). Remove o resto.'
      )
    ) {
      return;
    }
    setIsCleaning(true);
    try {
      const res = await adminFetch('/api/admin/media/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Erro na limpeza');
        return;
      }
      alert(data.message || 'Limpeza concluída.');
      await loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro na limpeza');
    } finally {
      setIsCleaning(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUploadedAt = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const copyFileUrl = async (file: MediaFile) => {
    const url = getPublicUrl(file);
    try {
      await navigator.clipboard.writeText(url);
      alert('URL copiada.');
    } catch {
      alert(url);
    }
  };

  return (
    <div
      className={`media-library ${isModal ? 'modal' : ''}`}
    >
      {/* Toolbar Superior */}
      <div className="media-toolbar">
        <div className="media-toolbar-left">
          <button
            type="button"
            className={`media-toolbar-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="Vista em lista"
          >
            <ListIcon className="media-toolbar-icon" />
          </button>
          <button
            type="button"
            className={`media-toolbar-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Vista em grelha"
          >
            <LayoutGrid className="media-toolbar-icon" />
          </button>
          
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*,video/*,.pdf"
            multiple
            hidden
            onChange={handleToolbarUpload}
          />
          <button
            type="button"
            className="media-upload-button"
            disabled={isUploading}
            onClick={() => uploadInputRef.current?.click()}
          >
            <Upload className="media-toolbar-icon" />
            {isUploading ? 'A carregar...' : 'Carregar ficheiros'}
          </button>

          {fullCatalog && !isModal ? (
            <button
              type="button"
              className="media-bulk-button"
              disabled={isCleaning || isUploading}
              onClick={() => void runCatalogCleanup()}
            >
              {isCleaning ? 'A limpar…' : 'Limpar duplicados'}
            </button>
          ) : null}

          {!isBulkMode ? (
            <button 
              onClick={() => setIsBulkMode(true)}
              className="media-bulk-button"
            >
              Seleção em massa
            </button>
          ) : (
            <div className="media-bulk-actions">
              <button onClick={deleteBulk} className="media-bulk-delete">Eliminar ({selectedIds.size})</button>
              <button onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }} className="media-bulk-cancel">Cancelar</button>
            </div>
          )}
        </div>

        <div className="media-toolbar-right">
          <select
            className="media-type-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'all' | MediaCategory);
              setVisibleCount(PAGE_BATCH);
            }}
            aria-label="Filtrar por tipo"
          >
            {TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="media-count">{filteredFiles.length} itens</div>
          {!externalSearchQuery && (
            <div className="media-search">
              <Search className="media-search-icon" />
              <input 
                type="text" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PAGE_BATCH);
                }}
                className="media-search-input"
              />
            </div>
          )}
        </div>
      </div>

      <div className="media-content">
        {/* Grid Principal */}
        <div className="media-grid-container">
          {loading && files.length === 0 ? (
            isMobileViewport ? (
              <p className="media-loading-hint">A carregar…</p>
            ) : (
              <SkeletonMediaGrid count={8} />
            )
          ) : viewMode === 'grid' ? (
            <div className="media-grid">
              {paginatedFiles.map((file) => (
                <div 
                  key={`${file.id}::${mediaCatalogKey(file.url)}`}
                  onClick={() => handlePrimaryItemClick(file)}
                  className={`media-item ${selectedIds.has(file.id) || activeFile?.id === file.id ? 'selected' : ''}`}
                >
                  {fileDisplayKind(file) === 'imagens' ? (
                    <img src={getPublicUrl(file)} className="media-item-image" alt="" loading="lazy" />
                  ) : fileDisplayKind(file) === 'videos' ? (
                    <div className="media-item-placeholder video"><Video className="media-toolbar-icon" /></div>
                  ) : (
                    <div className="media-item-placeholder document"><FileDown className="media-toolbar-icon" /></div>
                  )}
                  {selectedIds.has(file.id) && (
                    <div className="media-item-check"><Check className="media-check-icon" /></div>
                  )}
                  {isModal && onSelect && (
                    <div className="media-item-overlay">
                      <span className="media-select-text">Selecionar</span>
                    </div>
                  )}
                  {!(isModal && onSelect) && (
                    <div className="media-item-actions">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openDetails(file, true);
                        }}
                        className="media-action-button"
                        title="Editar"
                      >
                        <Edit3 className="media-action-icon" />
                      </button>
                      {canDeleteMedia(file) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteSingle(file);
                          }}
                          className="media-action-button media-action-button--danger"
                          title="Eliminar"
                        >
                          <Trash2 className="media-action-icon" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="media-list">
              {paginatedFiles.map((file) => (
                <div
                  key={`${file.id}::${mediaCatalogKey(file.url)}`}
                  className={`media-list-item ${selectedIds.has(file.id) || activeFile?.id === file.id ? 'selected' : ''}`}
                  onClick={() => handlePrimaryItemClick(file)}
                >
                  <input
                    type="checkbox"
                    className="media-list-checkbox"
                    checked={selectedIds.has(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selecionar ${file.name}`}
                  />
                  <div className="media-list-thumb">
                    {fileDisplayKind(file) === 'imagens' ? (
                      <img src={getPublicUrl(file)} className="media-list-thumb-image" alt="" loading="lazy" />
                    ) : fileDisplayKind(file) === 'videos' ? (
                      <div className="media-item-placeholder video"><Video className="media-toolbar-icon" /></div>
                    ) : (
                      <div className="media-item-placeholder document"><FileDown className="media-toolbar-icon" /></div>
                    )}
                  </div>
                  <div className="media-list-info">
                    <span className="media-list-name">{file.name}</span>
                    <span className="media-list-meta">
                      {file.subcategory} · {formatSize(file.metadata?.size)}
                    </span>
                  </div>
                  <div className="media-list-actions">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void openDetails(file, true);
                      }}
                      className="media-action-button media-action-button--list"
                      title="Editar"
                    >
                      <Edit3 className="media-action-icon" />
                    </button>
                    {canDeleteMedia(file) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteSingle(file);
                        }}
                        className="media-action-button media-action-button--list media-action-button--danger"
                        title="Eliminar"
                      >
                        <Trash2 className="media-action-icon" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && visibleCount < filteredFiles.length && (
            <div className="media-load-more">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_BATCH)}
                className="media-load-more-button"
              >
                Carregar mais ({filteredFiles.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Detalhes do anexo (ecrã completo, estilo WordPress) */}
      {activeFile && !isBulkMode && (
        <div className="media-attachment-modal" role="dialog" aria-modal="true" aria-labelledby="media-attachment-title">
          <header className="media-attachment-header">
            <h2 id="media-attachment-title" className="media-attachment-title">Detalhes do anexo</h2>
            <button type="button" onClick={closeAttachmentDetails} className="media-attachment-close" aria-label="Fechar">
              <X className="media-close-icon" />
            </button>
          </header>

          <div className="media-attachment-body">
            <div className="media-attachment-preview">
              {isEditingImage && fileDisplayKind(activeFile) === 'imagens' ? (
                <div className="media-edit-card">
                  <div className="media-edit-card-header">
                    <h3 className="media-edit-card-title">Ferramentas de Edição</h3>
                    <button
                      type="button"
                      className="media-edit-card-back"
                      onClick={() => setIsEditingImage(false)}
                    >
                      Voltar aos detalhes
                    </button>
                  </div>

                  <div className="media-edit-card-body">
                    <div className="media-edit-card-preview">
                      <img
                        src={getPublicUrl(activeFile)}
                        className="media-edit-card-image"
                        alt={metadata.alt_text || activeFile.name}
                      />
                    </div>

                    <div className="media-edit-card-controls">
                      <div className="media-edit-control-block">
                        <h4 className="media-edit-control-title">Redimensionar</h4>
                        <div className="media-editor-scale">
                          <div className="media-editor-scale-input">
                            <span className="media-scale-label">Largura</span>
                            <input
                              type="number"
                              value={editWidth}
                              onChange={(e) => setEditWidth(parseInt(e.target.value, 10) || 0)}
                              className="media-scale-input"
                            />
                          </div>
                          <span className="media-scale-x" aria-hidden>×</span>
                          <div className="media-editor-scale-input">
                            <span className="media-scale-label">Altura</span>
                            <input
                              type="number"
                              value={editHeight}
                              onChange={(e) => setEditHeight(parseInt(e.target.value, 10) || 0)}
                              className="media-scale-input"
                            />
                          </div>
                        </div>
                        <div className="media-edit-scale-links">
                          <button
                            type="button"
                            className="media-edit-scale-link"
                            onClick={() => {
                              setEditWidth(Math.round(editWidth * 0.5));
                              setEditHeight(Math.round(editHeight * 0.5));
                            }}
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            className="media-edit-scale-link"
                            onClick={() => {
                              setEditWidth(Math.round(editWidth * 0.75));
                              setEditHeight(Math.round(editHeight * 0.75));
                            }}
                          >
                            75%
                          </button>
                        </div>
                        <div className="media-edit-size-info">
                          <p>
                            <span className="media-edit-size-label">Tamanho atual:</span>{' '}
                            {formatSize(activeFile.metadata?.size)}
                          </p>
                          <p className="media-edit-size-estimate">
                            <span className="media-edit-size-label">Tamanho final estimado:</span>{' '}
                            {estimatedSize != null ? formatSize(Math.round(estimatedSize)) : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="media-edit-control-block">
                        <h4 className="media-edit-control-title">Formato e Otimização</h4>
                        <div className="media-editor-formats">
                          <label className="media-format-label">
                            <input
                              type="radio"
                              checked={editFormat === 'original'}
                              onChange={() => setEditFormat('original')}
                            />
                            <span>Manter original ({activeFile.metadata?.mimetype || 'image/jpeg'})</span>
                          </label>
                          <label className="media-format-label">
                            <input type="radio" checked={editFormat === 'webp'} onChange={() => setEditFormat('webp')} />
                            <span className="media-format-webp">Converter para WebP (Otimizado para Web)</span>
                          </label>
                          <label className="media-format-label">
                            <input type="radio" checked={editFormat === 'jpeg'} onChange={() => setEditFormat('jpeg')} />
                            <span>Converter para JPEG</span>
                          </label>
                        </div>
                      </div>

                      <div className="media-edit-card-actions">
                        <button
                          type="button"
                          onClick={applyImageEdits}
                          disabled={processingImage}
                          className="media-attachment-primary-btn"
                        >
                          {processingImage ? 'A processar…' : 'Guardar Alterações'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingImage(false)}
                          className="media-edit-cancel-btn"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="media-attachment-preview-stage">
                    {fileDisplayKind(activeFile) === 'imagens' ? (
                      <img
                        src={getPublicUrl(activeFile)}
                        className="media-attachment-preview-image"
                        alt={metadata.alt_text || activeFile.name}
                      />
                    ) : fileDisplayKind(activeFile) === 'videos' ? (
                      <video src={getPublicUrl(activeFile)} className="media-attachment-preview-image" controls />
                    ) : (
                      <div className="media-attachment-preview-placeholder">
                        <FileDown className="media-toolbar-icon" />
                        <span>{activeFile.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="media-attachment-preview-actions">
                    {fileDisplayKind(activeFile) === 'imagens' && (
                      <button
                        type="button"
                        className="media-attachment-primary-btn"
                        onClick={() => setIsEditingImage(true)}
                      >
                        Editar imagem
                      </button>
                    )}
                    <a
                      href={getPublicUrl(activeFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-attachment-secondary-btn"
                    >
                      <ExternalLink className="media-action-icon" aria-hidden />
                      Ver ficheiro completo
                    </a>
                  </div>
                </>
              )}
            </div>

            <aside className="media-attachment-sidebar">
              <div className="media-attachment-sidebar-scroll">
                <dl className="media-attachment-meta">
                  <div className="media-attachment-meta-row">
                    <dt>Carregado em</dt>
                    <dd>{formatUploadedAt(activeFile.created_at)}</dd>
                  </div>
                  <div className="media-attachment-meta-row">
                    <dt>Nome</dt>
                    <dd>{activeFile.name}</dd>
                  </div>
                  <div className="media-attachment-meta-row">
                    <dt>Tipo</dt>
                    <dd>{activeFile.metadata?.mimetype || '—'}</dd>
                  </div>
                  <div className="media-attachment-meta-row">
                    <dt>Tamanho</dt>
                    <dd>{formatSize(activeFile.metadata?.size)}</dd>
                  </div>
                </dl>

                <div className="media-metadata">
                  <div>
                    <label className="media-label" htmlFor="media-alt">Texto alternativo</label>
                    <textarea
                      id="media-alt"
                      value={metadata.alt_text}
                      onChange={(e) => setMetadata({ ...metadata, alt_text: e.target.value })}
                      className="media-textarea"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-title">Título</label>
                    <input
                      id="media-title"
                      type="text"
                      value={metadata.title}
                      onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                      className="media-input"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-caption">Legenda</label>
                    <textarea
                      id="media-caption"
                      value={metadata.caption}
                      onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                      className="media-textarea"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-description">Descrição</label>
                    <textarea
                      id="media-description"
                      value={metadata.description}
                      onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                      className="media-textarea"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-file-url">URL do ficheiro</label>
                    <input
                      id="media-file-url"
                      type="text"
                      readOnly
                      value={getPublicUrl(activeFile)}
                      className="media-input media-input-readonly"
                    />
                    <button
                      type="button"
                      className="media-attachment-copy-url"
                      onClick={() => copyFileUrl(activeFile)}
                    >
                      <Copy className="media-action-icon" aria-hidden />
                      Copiar URL
                    </button>
                  </div>
                </div>
              </div>

              <footer className="media-attachment-footer">
                {canDeleteMedia(activeFile) ? (
                  <button
                    type="button"
                    className="media-attachment-delete-link"
                    onClick={() => void deleteSingle(activeFile)}
                  >
                    Eliminar permanentemente
                  </button>
                ) : (
                  <span className="media-attachment-delete-disabled">
                    Este item não pode ser eliminado aqui.
                  </span>
                )}
                <button
                  type="button"
                  onClick={saveMetadata}
                  disabled={savingMetadata}
                  className="media-attachment-save-btn"
                >
                  {savingMetadata ? 'A guardar…' : 'Salvar'}
                </button>
              </footer>
            </aside>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {isPreviewOpen && previewImage && (
        <div
          className="media-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Pré-visualização — ${previewImage.name}`}
          onClick={closePreview}
        >
          <div className="media-preview-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closePreview} className="media-preview-close" aria-label="Fechar">
              <X className="media-close-icon" />
            </button>
            <div className="media-preview-stage">
              <button
                type="button"
                className="media-preview-nav media-preview-nav--prev"
                aria-label="Imagem anterior"
                disabled={previewImageIndex <= 0}
                onClick={() => shiftPreviewImage(-1)}
              >
                <ChevronLeft size={28} />
              </button>
              <img
                src={getPublicUrl(previewImage)}
                className="media-preview-full-image"
                alt={previewImage.name}
              />
              <button
                type="button"
                className="media-preview-nav media-preview-nav--next"
                aria-label="Imagem seguinte"
                disabled={
                  previewImageIndex < 0 ||
                  previewImageIndex >= previewGalleryImages.length - 1
                }
                onClick={() => shiftPreviewImage(1)}
              >
                <ChevronRight size={28} />
              </button>
            </div>
            <div className="media-preview-toolbar">
              <div className="media-preview-info">
                <h3 className="media-preview-title">{previewImage.name}</h3>
                <p className="media-preview-meta">
                  {formatSize(previewImage.metadata?.size)} • {previewImage.metadata?.mimetype}
                </p>
              </div>
              <div className="media-preview-actions">
                <button
                  type="button"
                  className="media-glass-button"
                  title="Editar"
                  onClick={() => openEditFromPreview(previewImage)}
                >
                  <Edit3 className="media-action-icon" />
                  <span>Editar</span>
                </button>
                {canDeleteMedia(previewImage) && (
                  <button
                    type="button"
                    className="media-glass-button media-glass-button--danger"
                    title="Eliminar"
                    onClick={() => void deleteSingle(previewImage)}
                  >
                    <Trash2 className="media-action-icon" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM SAVE CONFIRMATION POPUP (ENTRECAMPOS STYLE) */}
      {isSaveConfirmOpen && (
        <div className="media-save-confirm" role="dialog" aria-modal="true" aria-labelledby="media-save-confirm-title">
          <div className="media-save-confirm-dialog">
            <h3 id="media-save-confirm-title" className="media-save-confirm-title">
              Como deseja guardar?
            </h3>
            <p className="media-save-confirm-text">
              Selecione uma opção abaixo e clique em Guardar para aplicar as alterações à imagem.
            </p>

            <div className="media-save-confirm-options" role="radiogroup" aria-labelledby="media-save-confirm-title">
              <label className="media-save-confirm-choice">
                <input
                  type="radio"
                  name="media-save-mode"
                  className="media-save-confirm-checkbox"
                  checked={saveMode === 'replace'}
                  disabled={processingImage}
                  onChange={() => setSaveMode('replace')}
                />
                <span className="media-save-confirm-choice-label">
                  <strong>Substituir original</strong>
                  <span className="media-save-confirm-choice-desc">
                    O ficheiro actual é substituído pela versão editada.
                  </span>
                </span>
              </label>
              <label className="media-save-confirm-choice">
                <input
                  type="radio"
                  name="media-save-mode"
                  className="media-save-confirm-checkbox"
                  checked={saveMode === 'new'}
                  disabled={processingImage}
                  onChange={() => setSaveMode('new')}
                />
                <span className="media-save-confirm-choice-label">
                  <strong>Guardar como novo</strong>
                  <span className="media-save-confirm-choice-desc">
                    Cria um novo ficheiro e mantém o original intacto.
                  </span>
                </span>
              </label>
            </div>

            <div className="media-save-confirm-actions">
              <button
                type="button"
                onClick={closeSaveConfirm}
                disabled={processingImage}
                className="media-save-confirm-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitSaveConfirm}
                disabled={processingImage}
                className="media-save-confirm-submit"
              >
                {processingImage ? 'A guardar…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
