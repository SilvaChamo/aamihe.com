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
  RotateCcw,
} from 'lucide-react';
import type { MediaCategory } from '@/lib/site-media';
import { resolveMediaCategory } from '@/lib/resolve-media-category';
import { SkeletonMediaGrid } from '@/components/Admin/Skeleton';
import { dispatchMediaUpdated } from '@/lib/media-events';
import { useLanguage } from '@/context/LanguageContext';
import { adminMediaCopy, tMessages } from '@/i18n/messages';
import './MediaLibrary.css';

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  isModal?: boolean;
  externalSearchQuery?: string;
  /** Galeria pública: inclui ficheiros em /gallery e arquivo legado */
  fullCatalog?: boolean;
  /** Filtro inicial nas páginas Biblioteca / Documentos / Vídeos */
  initialCategory?: MediaCategory;
  /** Vista controlada pela secção (Biblioteca / Reciclagem) */
  libraryView?: 'library' | 'trash';
  onLibraryViewChange?: (view: 'library' | 'trash') => void;
}

interface TrashFile {
  id: string;
  name: string;
  url: string;
  trash_path: string;
  deleted_at: string;
  metadata?: {
    size: number;
    mimetype: string;
  } | null;
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

/** 7 colunas × 7 linhas por página da grelha */
const PAGE_BATCH = 49;

function dateLocaleFor(locale: 'pt' | 'fr' | 'en'): string {
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'en') return 'en-GB';
  return 'pt-PT';
}

export default function MediaLibrary({
  onSelect,
  isModal,
  externalSearchQuery,
  fullCatalog,
  initialCategory,
  libraryView: controlledLibraryView,
  onLibraryViewChange,
}: MediaLibraryProps) {
  const { locale } = useLanguage();
  const t = tMessages(adminMediaCopy, locale);
  const typeFilters = useMemo(
    (): { value: 'all' | MediaCategory; label: string }[] => [
      { value: 'imagens', label: t.typeImages },
      { value: 'documentos', label: t.typeDocuments },
      { value: 'videos', label: t.typeVideos },
      { value: 'all', label: t.typeAll },
    ],
    [t],
  );
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
  const [internalLibraryView, setInternalLibraryView] = useState<'library' | 'trash'>('library');
  const libraryView = controlledLibraryView ?? internalLibraryView;
  const setLibraryView = (
    value: 'library' | 'trash' | ((current: 'library' | 'trash') => 'library' | 'trash'),
  ) => {
    const next = typeof value === 'function' ? value(libraryView) : value;
    if (onLibraryViewChange) {
      onLibraryViewChange(next);
    } else {
      setInternalLibraryView(next);
    }
  };
  const [trashItems, setTrashItems] = useState<TrashFile[]>([]);
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
  const [isRestoring, setIsRestoring] = useState(false);
  const [editRestoreBackup, setEditRestoreBackup] = useState<TrashFile | null>(null);
  const [backupRefreshKey, setBackupRefreshKey] = useState(0);
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

  const loadImages = async (
    filter: 'all' | MediaCategory = typeFilter,
    options?: { silent?: boolean },
  ) => {
    if (!options?.silent) setLoading(true);
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
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    setVisibleCount(PAGE_BATCH);
    setActiveFile(null);
    setIsBulkMode(false);
    setSelectedIds(new Set());
    if (libraryView === 'trash') {
      void loadTrash();
    } else {
      void loadImages(typeFilter);
    }
  }, [typeFilter, fullCatalog, libraryView]);

  const loadTrash = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const res = await adminFetch('/api/admin/media/trash');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setTrashItems(
          data.items.map(
            (item: {
              id: string;
              url: string;
              trash_path: string;
              title: string;
              mime_type?: string;
              size?: number;
              deleted_at: string;
            }) => ({
              id: item.id,
              name: item.title,
              url: item.url,
              trash_path: item.trash_path,
              deleted_at: item.deleted_at,
              metadata: {
                size: item.size || 0,
                mimetype: item.mime_type || 'image/jpeg',
              },
            }),
          ),
        );
      } else {
        setTrashItems([]);
      }
    } catch (err) {
      console.error(err);
      setTrashItems([]);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  const restoreFromTrash = async (item: TrashFile) => {
    setTrashItems((prev) => prev.filter((entry) => entry.id !== item.id));
    try {
      const res = await adminFetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.errRestore);
      }
      dispatchMediaUpdated();
      void loadImages(typeFilter, { silent: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errRestore);
      void loadTrash({ silent: true });
    }
  };

  const purgeFromTrash = async (item: TrashFile) => {
    if (!confirm(t.purgeConfirm)) return;
    setTrashItems((prev) => prev.filter((entry) => entry.id !== item.id));
    try {
      const res = await adminFetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge', id: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.errDelete);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errDelete);
      void loadTrash({ silent: true });
    }
  };

  const restoreBulk = async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = trashItems.filter((item) => selectedIds.has(item.id));
    if (!selectedItems.length) {
      alert(t.noneSelectedRestore);
      return;
    }
    if (!confirm(t.restoreConfirm(selectedItems.length))) {
      return;
    }

    const ids = selectedItems.map((item) => item.id);
    setIsRestoring(true);
    setTrashItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setIsBulkMode(false);

    try {
      const res = await adminFetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', ids }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || Number(data.restored) === 0) {
        throw new Error(data.error || t.errBulkRestore);
      }
      if (Array.isArray(data.failed) && data.failed.length > 0) {
        alert(t.bulkRestorePartial(Number(data.restored), data.failed.length));
      }
      dispatchMediaUpdated();
      void loadImages(typeFilter, { silent: true });
      void loadTrash({ silent: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errBulkRestore);
      void loadTrash({ silent: true });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleTrashItemClick = (item: TrashFile) => {
    if (isBulkMode) {
      toggleSelect(item.id);
    }
  };

  useEffect(() => {
    if (
      !activeFile ||
      resolveMediaCategory({
        category: activeFile.category,
        mime_type: activeFile.metadata?.mimetype,
        url: activeFile.url,
      }) !== 'imagens'
    ) {
      setEditRestoreBackup(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await adminFetch('/api/admin/media/trash');
        const data = await res.json();
        if (cancelled || !data.success || !Array.isArray(data.items)) {
          if (!cancelled) setEditRestoreBackup(null);
          return;
        }
        const match = data.items.find(
          (item: { url: string }) => item.url.toLowerCase() === activeFile.url.toLowerCase(),
        );
        if (!match) {
          setEditRestoreBackup(null);
          return;
        }
        setEditRestoreBackup({
          id: match.id,
          name: match.title,
          url: match.url,
          trash_path: match.trash_path,
          deleted_at: match.deleted_at,
          metadata: {
            size: match.size || 0,
            mimetype: match.mime_type || 'image/jpeg',
          },
        });
      } catch {
        if (!cancelled) setEditRestoreBackup(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeFile?.id, activeFile?.url, backupRefreshKey]);

  const resetEditValues = () => {
    const { width, height } = originalImageDimensions.current;
    if (width && height) {
      setEditWidth(width);
      setEditHeight(height);
    }
    setEditFormat('original');
  };

  const restoreOriginalImage = async () => {
    if (!editRestoreBackup || !activeFile) return;
    if (!confirm(t.restoreOriginalConfirm)) return;

    setIsRestoring(true);
    try {
      const res = await adminFetch('/api/admin/media/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: editRestoreBackup.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || t.errRestore);
      }
      setEditRestoreBackup(null);
      setIsEditingImage(false);
      closeAttachmentDetails();
      dispatchMediaUpdated();
      void loadImages(typeFilter, { silent: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errRestore);
    } finally {
      setIsRestoring(false);
    }
  };

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
    const pixelRatio = (editWidth * editHeight) / (origW * origH);
    let est = baseSize * pixelRatio;
    if (pixelRatio > 1) {
      est *= 1 + (pixelRatio - 1) * 0.45;
    } else if (pixelRatio < 1) {
      est *= 0.55 + pixelRatio * 0.45;
    }
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

  const filteredTrash = useMemo(() => {
    const query = (externalSearchQuery || searchQuery).toLowerCase();
    return trashItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [trashItems, searchQuery, externalSearchQuery]);

  const paginatedTrash = useMemo(() => filteredTrash.slice(0, visibleCount), [filteredTrash, visibleCount]);

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
    a.id === b.id || a.url.toLowerCase() === b.url.toLowerCase();

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
        throw new Error(data.error || t.errSaveMetadata);
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
            : f,
        ),
      );
      setActiveFile((prev) =>
        prev && prev.id === activeFile.id && prev.url === activeFile.url
          ? {
              ...prev,
              name: metadata.title || prev.name,
              alt_text: metadata.alt_text,
              caption: metadata.caption,
              description: metadata.description,
            }
          : prev,
      );
      dispatchMediaUpdated();
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errSaveMetadata);
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
        throw new Error(data.error || t.errDeleteSingle);
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
      throw new Error(data.error || t.errBulkDeleteApi);
    }
    if (Array.isArray(data.failed) && data.failed.length > 0) {
      alert(t.bulkDeletePartial(Number(data.deleted), data.failed.length));
    }
  };

  const removeDeletedFromState = (deleted: MediaFile[]) => {
    const ids = new Set(deleted.map((f) => f.id));
    const urls = new Set(deleted.map((f) => f.url.toLowerCase()));
    setFiles((prev) => prev.filter((f) => !ids.has(f.id) && !urls.has(f.url.toLowerCase())));
  };

  const deleteSingle = async (file: MediaFile) => {
    if (!canDeleteMedia(file)) {
      alert(t.legacyNoDelete);
      return;
    }
    if (!confirm(t.moveToTrashConfirm)) return;
    const closeEditor = activeFile ? isSameMediaFile(activeFile, file) : false;
    const closePreviewModal = previewImage ? isSameMediaFile(previewImage, file) : false;
    removeDeletedFromState([file]);
    if (closeEditor) closeAttachmentDetails();
    if (closePreviewModal) closePreview();
    try {
      await requestDelete([file]);
      dispatchMediaUpdated();
      void loadImages(typeFilter, { silent: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errDeleteSingle);
      void loadImages(typeFilter, { silent: true });
    }
  };

  const deleteBulk = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const selectedFiles = files.filter((f) => ids.includes(f.id));
    if (!selectedFiles.length) {
      alert(t.noneSelectedDelete);
      return;
    }
    if (!confirm(t.moveToTrashBulkConfirm(selectedFiles.length))) {
      return;
    }
    removeDeletedFromState(selectedFiles);
    setSelectedIds(new Set());
    setIsBulkMode(false);
    try {
      await requestDelete(selectedFiles);
      dispatchMediaUpdated();
      void loadImages(typeFilter, { silent: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errBulkDelete);
      void loadImages(typeFilter, { silent: true });
    }
  };

  const applyImageEdits = () => {
    if (!activeFile) return;
    if (!editWidth || !editHeight) {
      alert(t.invalidDimensions);
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
      const res = await adminFetch('/api/admin/media/edit', {
        method: 'POST',
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
          alt_text: metadata.alt_text,
          caption: metadata.caption,
          description: metadata.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const msg = data.error || t.errSave;
        throw new Error(
          msg.includes('eliminar') || msg.toLowerCase().includes('delete') ? t.saveImageTryNew : msg
        );
      }

      setIsSaveConfirmOpen(false);
      setPendingEdit(null);
      setIsEditingImage(false);
      if (replace) {
        setBackupRefreshKey((key) => key + 1);
      } else {
        closeAttachmentDetails();
      }
      dispatchMediaUpdated();
      await loadImages(typeFilter, { silent: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errSave);
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
      alert(err instanceof Error ? err.message : t.errUpload);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const runCatalogCleanup = async () => {
    if (
      !confirm(t.cleanupConfirm)
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
        alert(data.error || t.errCleanup);
        return;
      }
      alert(data.message || t.cleanupDone);
      await loadImages();
    } catch (err) {
      alert(err instanceof Error ? err.message : t.errCleanup);
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
    return d.toLocaleDateString(dateLocaleFor(locale), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const copyFileUrl = async (file: MediaFile) => {
    const url = getPublicUrl(file);
    try {
      await navigator.clipboard.writeText(url);
      alert(t.urlCopied);
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
            aria-label={t.listView}
          >
            <ListIcon className="media-toolbar-icon" />
          </button>
          <button
            type="button"
            className={`media-toolbar-button ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label={t.gridView}
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
            disabled={isUploading || libraryView === 'trash'}
            onClick={() => uploadInputRef.current?.click()}
          >
            <Upload className="media-toolbar-icon" />
            {isUploading ? t.uploading : t.uploadFiles}
          </button>

          {fullCatalog && !isModal ? (
            <button
              type="button"
              className={`media-bulk-button ${libraryView === 'trash' ? 'active' : ''}`}
              onClick={() => {
                setLibraryView((current) => (current === 'trash' ? 'library' : 'trash'));
                setVisibleCount(PAGE_BATCH);
                setIsBulkMode(false);
                setSelectedIds(new Set());
              }}
            >
              {libraryView === 'trash' ? t.library : t.recycleBin}
            </button>
          ) : null}

          {libraryView === 'library' && fullCatalog && !isModal ? (
            <button
              type="button"
              className="media-bulk-button"
              disabled={isCleaning || isUploading}
              onClick={() => void runCatalogCleanup()}
            >
              {isCleaning ? t.cleaning : t.cleanupDuplicates}
            </button>
          ) : null}

          {libraryView === 'library' && !isBulkMode ? (
            <button 
              onClick={() => setIsBulkMode(true)}
              className="media-bulk-button"
            >
              {t.bulkSelect}
            </button>
          ) : libraryView === 'library' ? (
            <div className="media-bulk-actions">
              <button onClick={deleteBulk} className="media-bulk-delete">{t.deleteCount(selectedIds.size)}</button>
              <button onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }} className="media-bulk-cancel">{t.cancel}</button>
            </div>
          ) : libraryView === 'trash' && !isBulkMode ? (
            <button
              type="button"
              onClick={() => setIsBulkMode(true)}
              className="media-bulk-button"
              disabled={isRestoring || trashItems.length === 0}
            >
              {t.bulkSelect}
            </button>
          ) : libraryView === 'trash' ? (
            <div className="media-bulk-actions">
              <button
                type="button"
                onClick={() => void restoreBulk()}
                className="media-bulk-restore"
                disabled={isRestoring || selectedIds.size === 0}
              >
                {isRestoring ? t.restoring : t.restoreCount(selectedIds.size)}
              </button>
              <button
                type="button"
                onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }}
                className="media-bulk-cancel"
                disabled={isRestoring}
              >
                {t.cancel}
              </button>
            </div>
          ) : null}
        </div>

        <div className="media-toolbar-right">
          <select
            className="media-type-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'all' | MediaCategory);
              setVisibleCount(PAGE_BATCH);
            }}
            aria-label={t.filterByType}
          >
            {typeFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="media-count">
            {t.itemsCount(libraryView === 'trash' ? filteredTrash.length : filteredFiles.length)}
          </div>
          {!externalSearchQuery && (
            <div className="media-search">
              <Search className="media-search-icon" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
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
          {libraryView === 'trash' ? (
            loading && trashItems.length === 0 ? (
              <p className="media-loading-hint">{t.loadingTrash}</p>
            ) : paginatedTrash.length === 0 ? (
              <p className="media-empty-trash">{t.emptyTrash}</p>
            ) : (
              <div className="media-grid media-grid--trash">
                {paginatedTrash.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleTrashItemClick(item)}
                    className={`media-item media-item--trash${selectedIds.has(item.id) ? ' selected' : ''}${isBulkMode ? ' media-item--trash-selectable' : ''}`}
                  >
                    <div className="media-item--trash-image-wrap">
                      <img
                        src={item.trash_path}
                        className="media-item-image"
                        alt=""
                        loading="lazy"
                      />
                      {selectedIds.has(item.id) && (
                        <div className="media-item-check"><Check className="media-check-icon" /></div>
                      )}
                    </div>
                    <div className="media-trash-meta">
                      <span className="media-trash-name">{item.name}</span>
                      <span className="media-trash-date">
                        {new Date(item.deleted_at).toLocaleString(dateLocaleFor(locale))}
                      </span>
                    </div>
                    {!isBulkMode ? (
                      <div className="media-trash-actions">
                        <button
                          type="button"
                          className="media-glass-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void restoreFromTrash(item);
                          }}
                          title={t.restore}
                        >
                          <RotateCcw className="media-action-icon" />
                          <span>{t.restore}</span>
                        </button>
                        <button
                          type="button"
                          className="media-glass-button media-glass-button--danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            void purgeFromTrash(item);
                          }}
                          title={t.deletePermanent}
                        >
                          <Trash2 className="media-action-icon" />
                          <span>{t.delete}</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          ) : loading && files.length === 0 ? (
            isMobileViewport ? (
              <p className="media-loading-hint">{t.loading}</p>
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
                      <span className="media-select-text">{t.select}</span>
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
                        title={t.edit}
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
                          title={t.delete}
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
                    aria-label={t.selectItem(file.name)}
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
                      title={t.edit}
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
                        title={t.delete}
                      >
                        <Trash2 className="media-action-icon" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading &&
            visibleCount <
              (libraryView === 'trash' ? filteredTrash.length : filteredFiles.length) && (
            <div className="media-load-more">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_BATCH)}
                className="media-load-more-button"
              >
                {t.loadMore(
                  (libraryView === 'trash' ? filteredTrash.length : filteredFiles.length) - visibleCount,
                )}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Detalhes do anexo (ecrã completo, estilo WordPress) */}
      {activeFile && !isBulkMode && (
        <div className="media-attachment-modal" role="dialog" aria-modal="true" aria-labelledby="media-attachment-title">
          <header className="media-attachment-header">
            <h2 id="media-attachment-title" className="media-attachment-title">{t.attachmentTitle}</h2>
            <button type="button" onClick={closeAttachmentDetails} className="media-attachment-close" aria-label={t.close}>
              <X className="media-close-icon" />
            </button>
          </header>

          <div className="media-attachment-body">
            <div className="media-attachment-preview">
              {isEditingImage && fileDisplayKind(activeFile) === 'imagens' ? (
                <div className="media-edit-card">
                  <div className="media-edit-card-header">
                    <h3 className="media-edit-card-title">{t.editTools}</h3>
                    <button
                      type="button"
                      className="media-edit-card-back"
                      onClick={() => setIsEditingImage(false)}
                    >
                      {t.backToDetails}
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
                        <h4 className="media-edit-control-title">{t.resize}</h4>
                        <div className="media-editor-scale">
                          <div className="media-editor-scale-input">
                            <span className="media-scale-label">{t.width}</span>
                            <input
                              type="number"
                              value={editWidth}
                              onChange={(e) => setEditWidth(parseInt(e.target.value, 10) || 0)}
                              className="media-scale-input"
                            />
                          </div>
                          <span className="media-scale-x" aria-hidden>×</span>
                          <div className="media-editor-scale-input">
                            <span className="media-scale-label">{t.height}</span>
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
                            <span className="media-edit-size-label">{t.currentSize}</span>{' '}
                            {formatSize(activeFile.metadata?.size)}
                          </p>
                          <p className="media-edit-size-estimate">
                            <span className="media-edit-size-label">{t.estimatedSize}</span>{' '}
                            {estimatedSize != null ? formatSize(Math.round(estimatedSize)) : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="media-edit-control-block">
                        <h4 className="media-edit-control-title">{t.formatOptimization}</h4>
                        <div className="media-editor-formats">
                          <label className="media-format-label">
                            <input
                              type="radio"
                              checked={editFormat === 'original'}
                              onChange={() => setEditFormat('original')}
                            />
                            <span>{t.keepOriginal(activeFile.metadata?.mimetype || 'image/jpeg')}</span>
                          </label>
                          <label className="media-format-label">
                            <input type="radio" checked={editFormat === 'webp'} onChange={() => setEditFormat('webp')} />
                            <span className="media-format-webp">{t.convertWebp}</span>
                          </label>
                          <label className="media-format-label">
                            <input type="radio" checked={editFormat === 'jpeg'} onChange={() => setEditFormat('jpeg')} />
                            <span>{t.convertJpeg}</span>
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
                          {processingImage ? t.processing : t.saveChanges}
                        </button>
                        <button
                          type="button"
                          onClick={resetEditValues}
                          className="media-edit-reset-btn"
                          disabled={processingImage}
                        >
                          {t.resetEditValues}
                        </button>
                        {editRestoreBackup ? (
                          <button
                            type="button"
                            onClick={() => void restoreOriginalImage()}
                            className="media-edit-restore-btn"
                            disabled={processingImage || isRestoring}
                          >
                            <RotateCcw className="media-action-icon" aria-hidden />
                            {t.restoreOriginalImage}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setIsEditingImage(false)}
                          className="media-edit-cancel-btn"
                        >
                          {t.cancel}
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
                        {t.editImage}
                      </button>
                    )}
                    {editRestoreBackup && fileDisplayKind(activeFile) === 'imagens' ? (
                      <button
                        type="button"
                        className="media-attachment-restore-btn"
                        disabled={isRestoring}
                        onClick={() => void restoreOriginalImage()}
                      >
                        <RotateCcw className="media-action-icon" aria-hidden />
                        {t.restoreOriginalImage}
                      </button>
                    ) : null}
                    <a
                      href={getPublicUrl(activeFile)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-attachment-secondary-btn"
                    >
                      <ExternalLink className="media-action-icon" aria-hidden />
                      {t.viewFullFile}
                    </a>
                  </div>
                </>
              )}
            </div>

            <aside className="media-attachment-sidebar">
              <div className="media-attachment-sidebar-scroll">
                <dl className="media-attachment-meta">
                  <div className="media-attachment-meta-row">
                    <dt>{t.uploadedAt}</dt>
                    <dd>{formatUploadedAt(activeFile.created_at)}</dd>
                  </div>
                  <div className="media-attachment-meta-row">
                    <dt>{t.name}</dt>
                    <dd>{activeFile.name}</dd>
                  </div>
                  <div className="media-attachment-meta-row">
                    <dt>{t.type}</dt>
                    <dd>{activeFile.metadata?.mimetype || '—'}</dd>
                  </div>
                  <div className="media-attachment-meta-row">
                    <dt>{t.size}</dt>
                    <dd>{formatSize(activeFile.metadata?.size)}</dd>
                  </div>
                </dl>

                <div className="media-metadata">
                  <div>
                    <label className="media-label" htmlFor="media-alt">{t.altText}</label>
                    <textarea
                      id="media-alt"
                      value={metadata.alt_text}
                      onChange={(e) => setMetadata({ ...metadata, alt_text: e.target.value })}
                      className="media-textarea"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-title">{t.titleLabel}</label>
                    <input
                      id="media-title"
                      type="text"
                      value={metadata.title}
                      onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                      className="media-input"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-caption">{t.caption}</label>
                    <textarea
                      id="media-caption"
                      value={metadata.caption}
                      onChange={(e) => setMetadata({ ...metadata, caption: e.target.value })}
                      className="media-textarea"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-description">{t.description}</label>
                    <textarea
                      id="media-description"
                      value={metadata.description}
                      onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                      className="media-textarea"
                    />
                  </div>
                  <div>
                    <label className="media-label" htmlFor="media-file-url">{t.fileUrl}</label>
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
                      {t.copyUrl}
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
                    {t.deletePermanent}
                  </button>
                ) : (
                  <span className="media-attachment-delete-disabled">
                    {t.cannotDeleteHere}
                  </span>
                )}
                <button
                  type="button"
                  onClick={saveMetadata}
                  disabled={savingMetadata}
                  className="media-attachment-save-btn"
                >
                  {savingMetadata ? t.saving : t.save}
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
          aria-label={t.previewAria(previewImage.name)}
          onClick={closePreview}
        >
          <div className="media-preview-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closePreview} className="media-preview-close" aria-label={t.close}>
              <X className="media-close-icon" />
            </button>
            <div className="media-preview-outer">
              {previewGalleryImages.length > 1 ? (
                <button
                  type="button"
                  className="media-preview-nav media-preview-nav--prev"
                  aria-label={t.previousImage}
                  disabled={previewImageIndex <= 0}
                  onClick={() => shiftPreviewImage(-1)}
                >
                  <ChevronLeft size={28} />
                </button>
              ) : (
                <span className="media-preview-nav-spacer" aria-hidden />
              )}

              <div className="media-preview-frame">
                <div className="media-preview-viewport">
                  <img
                    src={getPublicUrl(previewImage)}
                    className="media-preview-full-image"
                    alt={previewImage.name}
                  />
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
                      title={t.edit}
                      onClick={() => openEditFromPreview(previewImage)}
                    >
                      <Edit3 className="media-action-icon" />
                      <span>{t.edit}</span>
                    </button>
                    {canDeleteMedia(previewImage) && (
                      <button
                        type="button"
                        className="media-glass-button media-glass-button--danger"
                        title={t.delete}
                        onClick={() => void deleteSingle(previewImage)}
                      >
                        <Trash2 className="media-action-icon" />
                        <span>{t.delete}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {previewGalleryImages.length > 1 ? (
                <button
                  type="button"
                  className="media-preview-nav media-preview-nav--next"
                  aria-label={t.nextImage}
                  disabled={
                    previewImageIndex < 0 ||
                    previewImageIndex >= previewGalleryImages.length - 1
                  }
                  onClick={() => shiftPreviewImage(1)}
                >
                  <ChevronRight size={28} />
                </button>
              ) : (
                <span className="media-preview-nav-spacer" aria-hidden />
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM SAVE CONFIRMATION POPUP (ENTRECAMPOS STYLE) */}
      {isSaveConfirmOpen && (
        <div className="media-save-confirm" role="dialog" aria-modal="true" aria-labelledby="media-save-confirm-title">
          <div className="media-save-confirm-dialog">
            <h3 id="media-save-confirm-title" className="media-save-confirm-title">
              {t.saveConfirmTitle}
            </h3>
            <p className="media-save-confirm-text">
              {t.saveConfirmText}
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
                  <strong>{t.replaceOriginal}</strong>
                  <span className="media-save-confirm-choice-desc">
                    {t.replaceOriginalDesc}
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
                  <strong>{t.saveAsNew}</strong>
                  <span className="media-save-confirm-choice-desc">
                    {t.saveAsNewDesc}
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
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={submitSaveConfirm}
                disabled={processingImage}
                className="media-save-confirm-submit"
              >
                {processingImage ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
