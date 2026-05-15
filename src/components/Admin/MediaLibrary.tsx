'use client';

import { useState, useEffect, useMemo } from 'react';
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
  FileDown
} from 'lucide-react';
import './MediaLibrary.css';

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  isModal?: boolean;
  externalSearchQuery?: string;
}

interface StorageFile {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  metadata?: {
    size: number;
    mimetype: string;
  } | null;
}

export default function MediaLibrary({ onSelect, isModal, externalSearchQuery }: MediaLibraryProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<StorageFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(70);
  
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
  
  // Metadata States
  const [metadata, setMetadata] = useState({
    alt_text: '',
    title: '',
    caption: '',
    description: ''
  });
  const [savingMetadata, setSavingMetadata] = useState(false);

  // Load images from public/gallery folder
  const loadImages = async () => {
    setLoading(true);
    try {
      // Simulate loading images from the gallery folder
      const imageFiles = [
        { name: '3-Tiago-Caungo-Mutombo-Vice-President-Lusophone-compressed-scaled.jpg.webp', metadata: { size: 119358, mimetype: 'image/webp' } },
        { name: '4-Rene-Gnalega-Vice-President-Francophone-compressed-scaled.jpg.webp', metadata: { size: 113710, mimetype: 'image/webp' } },
        { name: '5-Yar-Donlah-Gonway-Gono-Vice-President-Anglophone-compressed-scaled.jpg.webp', metadata: { size: 142406, mimetype: 'image/webp' } },
        { name: '6-Peter-Mageto-Secretary-compressed-scaled.jpg.webp', metadata: { size: 61796, mimetype: 'image/webp' } },
        { name: '7-Jamisse-Taimo-Consultants-Executive-Officer-compressed-scaled.jpg.webp', metadata: { size: 100124, mimetype: 'image/webp' } },
        { name: '9-Tukumbi-Lumumba-Kasongo-Consultants-compressed-scaled.jpg.webp', metadata: { size: 113410, mimetype: 'image/webp' } },
        { name: 'President-Kongolo-Chijika-1.jpg.webp', metadata: { size: 102418, mimetype: 'image/webp' } },
        { name: 'Vice-President-Anglophone-Rosemary.jpg.webp', metadata: { size: 181090, mimetype: 'image/webp' } },
        { name: 'Ocean-acidification-training.jpeg.webp', metadata: { size: 51732, mimetype: 'image/webp' } },
        { name: '647268264_1204088871880282_9104226780545651263_n.jpg', metadata: { size: 106168, mimetype: 'image/jpeg' } },
        { name: '647704531_1204895398466296_3711846847153028344_n.jpg', metadata: { size: 82655, mimetype: 'image/jpeg' } },
        { name: '648985636_1205610048394831_7145794994169769278_n.jpg', metadata: { size: 65019, mimetype: 'image/jpeg' } },
        { name: '665869693_1605095437427935_5862029230954093158_n.jpg', metadata: { size: 63016, mimetype: 'image/jpeg' } },
        { name: '696961631_1258292909793211_21745030036662716_n.jpg', metadata: { size: 37156, mimetype: 'image/jpeg' } },
        { name: 'BgNoticias.jpeg', metadata: { size: 1737908, mimetype: 'image/jpeg' } },
      ];
      setFiles(imageFiles);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const filteredFiles = useMemo(() => {
    const query = (externalSearchQuery || searchQuery).toLowerCase();
    return files.filter(f => f.name.toLowerCase().includes(query));
  }, [files, searchQuery, externalSearchQuery]);

  const paginatedFiles = useMemo(() => {
    return filteredFiles.slice(0, visibleCount);
  }, [filteredFiles, visibleCount]);

  const toggleSelect = (name: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(name)) newSelected.delete(name);
    else newSelected.add(name);
    setSelectedIds(newSelected);
  };

  const getPublicUrl = (filename: string) => {
    return `/gallery/${filename}`;
  };

  const openDetails = async (file: StorageFile) => {
    setActiveFile(file);
    setIsEditingImage(false);
    
    // Load original image dimensions for editing
    const img = new Image();
    img.src = getPublicUrl(file.name);
    img.onload = () => {
      setEditWidth(img.width);
      setEditHeight(img.height);
    };
    
    // Set default metadata
    setMetadata({
      alt_text: '',
      title: file.name.split('-').slice(0, -1).join('-') || file.name,
      caption: '',
      description: ''
    });
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

  const deleteSingle = async (filename: string) => {
    if (!confirm('Eliminar esta imagem permanentemente?')) return;
    setLoading(true);
    // Simulate deletion
    setFiles(prev => prev.filter(f => f.name !== filename));
    setActiveFile(null);
    setIsEditorOpen(false);
    setLoading(false);
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Eliminar ${selectedIds.size} itens?`)) return;
    setLoading(true);
    const ids = Array.from(selectedIds);
    setFiles(prev => prev.filter(f => !ids.includes(f.name)));
    setSelectedIds(new Set());
    setIsBulkMode(false);
    setLoading(false);
  };

  const applyImageEdits = async () => {
    if (!activeFile) return;
    setProcessingImage(true);
    
    try {
      const img = new Image();
      img.src = getPublicUrl(activeFile.name);
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

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`media-library ${isModal ? 'modal' : ''}`}>
      {/* Toolbar Superior */}
      <div className="media-toolbar">
        <div className="media-toolbar-left">
          <button className="media-toolbar-button"><ListIcon className="media-toolbar-icon" /></button>
          <button className="media-toolbar-button active"><LayoutGrid className="media-toolbar-icon" /></button>
          
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
          <div className="media-count">{filteredFiles.length} itens</div>
          {!externalSearchQuery && (
            <div className="media-search">
              <Search className="media-search-icon" />
              <input 
                type="text" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
          ) : (
            <div className={`media-grid ${activeFile && !isBulkMode ? 'with-sidebar' : ''}`}>
              {paginatedFiles.map((file) => (
                <div 
                  key={file.name}
                  onClick={() => {
                    if (isBulkMode) {
                      toggleSelect(file.name);
                    } else if (isModal && onSelect) {
                      onSelect(getPublicUrl(file.name));
                    } else {
                      openDetails(file);
                    }
                  }}
                  className={`media-item ${selectedIds.has(file.name) || activeFile?.name === file.name ? 'selected' : ''}`}
                >
                  <img src={getPublicUrl(file.name)} className="media-item-image" alt="" loading="lazy" />
                  {selectedIds.has(file.name) && (
                    <div className="media-item-check"><Check className="media-check-icon" /></div>
                  )}
                  {isModal && onSelect && (
                    <div className="media-item-overlay">
                      <span className="media-select-text">Selecionar</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {!loading && visibleCount < filteredFiles.length && (
            <div className="media-load-more">
              <button onClick={() => setVisibleCount(prev => prev + 70)} className="media-load-more-button">Carregar mais</button>
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
                <img src={getPublicUrl(activeFile.name)} className="media-preview-image" alt="" />
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
                <button onClick={() => deleteSingle(activeFile.name)} className="media-delete-button"><Trash2 className="media-delete-icon" /></button>
              </div>

              <div className="media-file-info">
                <div className="media-info-item">
                  <span className="media-info-label">Nome do ficheiro:</span>
                  <span className="media-info-value">{activeFile.name}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">Tipo:</span>
                  <span className="media-info-value">{activeFile.metadata?.mimetype}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">Tamanho:</span>
                  <span className="media-info-value">{formatSize(activeFile.metadata?.size)}</span>
                </div>
                <div className="media-info-item">
                  <span className="media-info-label">URL:</span>
                  <span className="media-info-value">{getPublicUrl(activeFile.name)}</span>
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
                <img src={getPublicUrl(activeFile.name)} className="media-editor-image" alt="" />
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
