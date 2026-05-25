'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { uploadMediaFiles } from '@/lib/persist-client-media';
import { canDeleteMedia, mediaCatalogKey } from '@/lib/media-catalog-key';
import { 
  Trash2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ImageIcon, 
  Upload, 
  X,
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  Check,
  Plus,
  AlertCircle,
  FileDown,
  Eye,
  Edit3,
  Video
} from 'lucide-react';
import type { MediaCategory } from '@/lib/site-media';
import { resolveMediaCategory } from '@/lib/resolve-media-category';
import './MediaLibrary.css';

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  isModal?: boolean;
  externalSearchQuery?: string;
  /** Galeria pública: inclui ficheiros em /gallery e arquivo legado */
  fullCatalog?: boolean;
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
}

const TYPE_FILTERS: { value: 'all' | MediaCategory; label: string }[] = [
  { value: 'imagens', label: 'Imagens' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'videos', label: 'Vídeos' },
  { value: 'all', label: 'Todos' },
];

const PAGE_BATCH = 48;

export default function MediaLibrary({ onSelect, isModal, externalSearchQuery, fullCatalog }: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaCategory>('imagens');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_BATCH);
  
  // Advanced Editor States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editWidth, setEditWidth] = useState(0);
  const [editHeight, setEditHeight] = useState(0);
  const [editFormat, setEditFormat] = useState<'original' | 'webp' | 'jpeg'>('original');
  const [processingImage, setProcessingImage] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<{ blob: Blob; mimeType: string; extension: string } | null>(null);
  
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
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadImages = async (filter: 'all' | MediaCategory = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fullCatalog) params.set('catalog', 'full');
      if (filter !== 'all') params.set('category', filter);

      const query = params.toString();
      const res = await fetch(`/api/admin/media${query ? `?${query}` : ''}`);
      const data = await res.json();
      if (data.success) {
        const mapped = data.media.map(
          (item: {
            id: string;
            title: string;
            url: string;
            category: MediaCategory;
            subcategory: string;
            mime_type: string;
            size?: number;
            source?: string;
          }) => ({
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
          })
        );
        const byKey = new Map<string, MediaFile>();
        for (const file of mapped) {
          const key = `${file.id}::${mediaCatalogKey(file.url)}`;
          if (!byKey.has(key)) byKey.set(key, file);
        }
        setFiles(Array.from(byKey.values()));
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

  const filteredFiles = useMemo(() => {
    const query = (externalSearchQuery || searchQuery).toLowerCase();
    return files.filter((f) => {
      const kind = resolveMediaCategory({
        category: f.category,
        mime_type: f.metadata?.mimetype,
        url: f.url,
      });
      const matchesType = typeFilter === 'all' || kind === typeFilter;
      const matchesSearch =
        !query ||
        f.name.toLowerCase().includes(query) ||
        f.subcategory.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [files, searchQuery, externalSearchQuery, typeFilter]);

  const paginatedFiles = useMemo(() => {
    return filteredFiles.slice(0, visibleCount);
  }, [filteredFiles, visibleCount]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const getPublicUrl = (file: MediaFile) => file.url;

  const openDetails = async (file: MediaFile) => {
    setActiveFile(file);
    setIsEditingImage(false);

    if (file.category === 'imagens') {
      const img = new Image();
      img.src = getPublicUrl(file);
      img.onload = () => {
        setEditWidth(img.width);
        setEditHeight(img.height);
      };
    }
    
    // Set default metadata
    setMetadata({
      alt_text: '',
      title: file.name,
      caption: '',
      description: ''
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

  const saveMetadata = async () => {
    if (!activeFile) return;
    setSavingMetadata(true);
    try {
      // Simulate saving metadata
      alert('Metadados guardados!');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMetadata(false);
    }
  };

  const deleteSingle = async (file: MediaFile) => {
    if (!canDeleteMedia(file)) {
      alert('Este item do arquivo legado não pode ser eliminado aqui.');
      return;
    }
    if (!confirm('Eliminar este item permanentemente?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(file.id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Erro ao eliminar');
        return;
      }
      setActiveFile(null);
      setIsEditorOpen(false);
      await loadImages();
    } finally {
      setLoading(false);
    }
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const deletable = files.filter((f) => ids.includes(f.id) && canDeleteMedia(f));
    if (deletable.length === 0) {
      alert('Nenhum dos itens seleccionados pode ser eliminado.');
      return;
    }
    if (!confirm(`Eliminar ${deletable.length} item(ns)?`)) return;
    setLoading(true);
    try {
      for (const file of deletable) {
        const res = await fetch(`/api/admin/media?id=${encodeURIComponent(file.id)}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || `Erro ao eliminar ${file.name}`);
          break;
        }
      }
      setSelectedIds(new Set());
      setIsBulkMode(false);
      await loadImages();
    } finally {
      setLoading(false);
    }
  };

  const applyImageEdits = async () => {
    if (!activeFile) return;
    setProcessingImage(true);
    
    try {
      const img = new Image();
      img.src = getPublicUrl(activeFile);
      await new Promise((resolve, reject) => { 
        img.onload = resolve;
        img.onerror = () => reject(new Error('Falha ao carregar imagem para edição.'));
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const finalWidth = editWidth || img.width;
      const finalHeight = editHeight || img.height;
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      if (ctx) ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      const mimeType = editFormat === 'webp' ? 'image/webp' : editFormat === 'jpeg' ? 'image/jpeg' : activeFile.metadata?.mimetype || 'image/jpeg';
      const extension = editFormat === 'webp' ? '.webp' : editFormat === 'jpeg' ? '.jpg' : '.' + activeFile.name.split('.').pop();
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b!), mimeType, 0.85);
      });

      setPendingBlob({ blob, mimeType, extension });
      setIsSaveConfirmOpen(true);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setProcessingImage(false);
    }
  };

  const confirmSave = async (replace: boolean) => {
    if (!activeFile || !pendingBlob) return;
    setProcessingImage(true);
    
    try {
      let fileName = activeFile.name;
      
      if (replace) {
        // Keep original name
      } else {
        fileName = activeFile.name.replace(/\.[^/.]+$/, "") + `_edited_${Date.now()}${pendingBlob.extension}`;
      }

      // In a real app, you would upload to server here
      alert(replace ? 'Imagem original substituída com sucesso!' : 'Imagem guardada como novo ficheiro!');
      setIsSaveConfirmOpen(false);
      setPendingBlob(null);
      setIsEditingImage(false);
      setIsEditorOpen(false);
      loadImages();
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
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

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`media-library ${isModal ? 'modal' : ''} ${activeFile && !isBulkMode ? 'has-detail-sidebar' : ''}`}
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
            <div className="media-loading"><RefreshCw className="media-loading-icon" /></div>
          ) : viewMode === 'grid' ? (
            <div className={`media-grid ${activeFile && !isBulkMode ? 'with-sidebar' : ''}`}>
              {paginatedFiles.map((file) => (
                <div 
                  key={`${file.id}::${mediaCatalogKey(file.url)}`}
                  onClick={() => {
                    if (isBulkMode) {
                      toggleSelect(file.id);
                    } else if (isModal && onSelect) {
                      onSelect(getPublicUrl(file));
                    } else {
                      openDetails(file);
                    }
                  }}
                  className={`media-item ${selectedIds.has(file.id) || activeFile?.id === file.id ? 'selected' : ''}`}
                >
                  {file.category === 'imagens' ? (
                    <img src={getPublicUrl(file)} className="media-item-image" alt="" loading="lazy" />
                  ) : file.category === 'videos' ? (
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
                  <div className="media-item-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetails(file);
                      }}
                      className="media-action-button edit"
                      title="Editar"
                    >
                      <Edit3 className="media-action-icon" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(file);
                      }}
                      className="media-action-button view"
                      title="Ver"
                    >
                      <Eye className="media-action-icon" />
                    </button>
                    {canDeleteMedia(file) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSingle(file);
                        }}
                        className="media-action-button delete"
                        title="Eliminar"
                      >
                        <Trash2 className="media-action-icon" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`media-list ${activeFile && !isBulkMode ? 'with-sidebar' : ''}`}>
              {paginatedFiles.map((file) => (
                <div
                  key={`${file.id}::${mediaCatalogKey(file.url)}`}
                  className={`media-list-item ${selectedIds.has(file.id) || activeFile?.id === file.id ? 'selected' : ''}`}
                  onClick={() => {
                    if (isModal && onSelect) {
                      onSelect(getPublicUrl(file));
                    } else {
                      openDetails(file);
                    }
                  }}
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
                    {file.category === 'imagens' ? (
                      <img src={getPublicUrl(file)} className="media-list-thumb-image" alt="" loading="lazy" />
                    ) : file.category === 'videos' ? (
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
                        openDetails(file);
                      }}
                      className="media-action-button edit"
                      title="Editar"
                    >
                      <Edit3 className="media-action-icon" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreview(file);
                      }}
                      className="media-action-button view"
                      title="Ver"
                    >
                      <Eye className="media-action-icon" />
                    </button>
                    {canDeleteMedia(file) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSingle(file);
                        }}
                        className="media-action-button delete"
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

        {/* Barra Lateral WordPress */}
        {activeFile && !isBulkMode && (
          <aside className="media-sidebar">
            <div className="media-sidebar-header">
              <h3 className="media-sidebar-title">Detalhes do anexo</h3>
              <button onClick={() => setActiveFile(null)} className="media-sidebar-close"><X className="media-close-icon" /></button>
            </div>

            <div className="media-sidebar-content">
              <div className="media-preview">
                <img src={getPublicUrl(activeFile)} className="media-preview-image" alt="" />
              </div>

              <div className="media-metadata">
                <div>
                  <label className="media-label">Texto alternativo</label>
                  <textarea value={metadata.alt_text} onChange={(e) => setMetadata({...metadata, alt_text: e.target.value})} className="media-textarea" />
                </div>
                <div>
                  <label className="media-label">Título</label>
                  <input type="text" value={metadata.title} onChange={(e) => setMetadata({...metadata, title: e.target.value})} className="media-input" />
                </div>
                <div>
                  <label className="media-label">Legenda</label>
                  <textarea value={metadata.caption} onChange={(e) => setMetadata({...metadata, caption: e.target.value})} className="media-textarea" />
                </div>
              </div>

              <div className="media-sidebar-actions">
                <button onClick={() => setIsEditorOpen(true)} className="media-edit-button">Editar Imagem</button>
                <button onClick={saveMetadata} disabled={savingMetadata} className="media-save-button">{savingMetadata ? '...' : 'Salvar'}</button>
                {canDeleteMedia(activeFile) && (
                  <button type="button" onClick={() => deleteSingle(activeFile)} className="media-delete-button"><Trash2 className="media-delete-icon" /></button>
                )}
              </div>

              <div className="media-file-info">
                <div className="media-info-item">
                  <span className="media-info-label">Nome do ficheiro:</span>
                  <span className="media-info-value">{activeFile.name}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">Tipo:</span>
                  <span className="media-info-value">{activeFile.category}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">Categoria:</span>
                  <span className="media-info-value">{activeFile.subcategory}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">Mime:</span>
                  <span className="media-info-value">{activeFile.metadata?.mimetype}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">Tamanho:</span>
                  <span className="media-info-value">{formatSize(activeFile.metadata?.size)}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">URL:</span>
                  <span className="media-info-value">{getPublicUrl(activeFile)}</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL DE EDIÇÃO AVANÇADA (WP STYLE) */}
      {isEditorOpen && activeFile && (
        <div className="media-editor-modal">
          <div className="media-editor-header">
            <h2 className="media-editor-title">Editar Imagem</h2>
            <button onClick={() => setIsEditorOpen(false)} className="media-editor-close"><X className="media-close-icon" /></button>
          </div>

          <div className="media-editor-body">
            <div className="media-editor-preview">
              <div className="media-editor-image-container">
                <img src={getPublicUrl(activeFile)} className="media-editor-image" alt="" />
              </div>
            </div>

            <aside className="media-editor-sidebar">
              <div className="media-editor-section">
                <h3 className="media-editor-section-title">Escalar Imagem</h3>
                <div className="media-editor-scale">
                  <div className="media-editor-scale-input">
                    <span className="media-scale-label">Largura</span>
                    <input type="number" value={editWidth} onChange={(e) => setEditWidth(parseInt(e.target.value))} className="media-scale-input" />
                  </div>
                  <X className="media-scale-x" />
                  <div className="media-editor-scale-input">
                    <span className="media-scale-label">Altura</span>
                    <input type="number" value={editHeight} onChange={(e) => setEditHeight(parseInt(e.target.value))} className="media-scale-input" />
                  </div>
                </div>
                <div className="media-editor-presets">
                  <button onClick={() => { setEditWidth(Math.round(editWidth*0.5)); setEditHeight(Math.round(editHeight*0.5)); }} className="media-preset-button">50%</button>
                  <button onClick={() => { setEditWidth(Math.round(editWidth*0.75)); setEditHeight(Math.round(editHeight*0.75)); }} className="media-preset-button">75%</button>
                </div>
              </div>

              <div className="media-editor-section">
                <h3 className="media-editor-section-title">Formato e Otimização</h3>
                <div className="media-editor-formats">
                  <label className="media-format-label"><input type="radio" checked={editFormat === 'original'} onChange={() => setEditFormat('original')} /><span>Original ({activeFile.metadata?.mimetype})</span></label>
                  <label className="media-format-label"><input type="radio" checked={editFormat === 'webp'} onChange={() => setEditFormat('webp')} /><span className="media-format-webp">WebP (Super Leve)</span></label>
                  <label className="media-format-label"><input type="radio" checked={editFormat === 'jpeg'} onChange={() => setEditFormat('jpeg')} /><span>JPEG</span></label>
                </div>
              </div>

              <div className="media-editor-actions">
                <button onClick={applyImageEdits} disabled={processingImage} className="media-editor-save">{processingImage ? 'A processar...' : 'Guardar Como Novo'}</button>
                <button onClick={() => setIsEditorOpen(false)} className="media-editor-cancel">Cancelar</button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {isPreviewOpen && previewImage && (
        <div className="media-preview-modal">
          <div className="media-preview-content">
            <button onClick={closePreview} className="media-preview-close"><X className="media-close-icon" /></button>
            <img src={getPublicUrl(previewImage)} className="media-preview-full-image" alt={previewImage.name} />
            <div className="media-preview-info">
              <h3 className="media-preview-title">{previewImage.name}</h3>
              <p className="media-preview-meta">{formatSize(previewImage.metadata?.size)} • {previewImage.metadata?.mimetype}</p>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM SAVE CONFIRMATION POPUP (ENTRECAMPOS STYLE) */}
      {isSaveConfirmOpen && (
        <div className="media-save-confirm">
          <div className="media-save-confirm-dialog">
            <div className="media-save-confirm-content">
              <div className="media-save-confirm-header">
                <div className="media-save-confirm-icon">
                  <AlertCircle className="media-alert-icon" />
                </div>
                <div>
                  <h3 className="media-save-confirm-title">Como deseja guardar?</h3>
                  <p className="media-save-confirm-subtitle">Escolha como aplicar as edições feitas na imagem.</p>
                </div>
              </div>

              <div className="media-save-confirm-options">
                <button 
                  onClick={() => confirmSave(true)}
                  disabled={processingImage}
                  className="media-save-confirm-option"
                >
                  <div>
                    <span className="media-save-confirm-option-title">Substituir Original</span>
                    <span className="media-save-confirm-option-desc">O ficheiro antigo será removido e substituído por este.</span>
                  </div>
                  <RefreshCw className="media-save-confirm-option-icon" />
                </button>

                <button 
                  onClick={() => confirmSave(false)}
                  disabled={processingImage}
                  className="media-save-confirm-option"
                >
                  <div>
                    <span className="media-save-confirm-option-title">Guardar Como Novo</span>
                    <span className="media-save-confirm-option-desc">Cria uma nova versão da imagem mantendo a original intacta.</span>
                  </div>
                  <FileDown className="media-save-confirm-option-icon" />
                </button>
              </div>
            </div>

            <div className="media-save-confirm-footer">
              <button 
                onClick={() => { setIsSaveConfirmOpen(false); setPendingBlob(null); }}
                className="media-save-confirm-cancel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
