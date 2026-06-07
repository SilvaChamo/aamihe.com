'use client';

import React from 'react';
import { Image, Save, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import '../definicoes.css';

const DEFAULTS = {
  maxUploadSize: 10,
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'] as string[],
  autoCompress: true,
  compressQuality: 80,
  createThumbnails: true,
  thumbnailSize: 300,
};

const copy = {
  pt: {
    title: 'Definições de Media',
    subtitle: 'Configure as opções de upload e processamento de imagens',
    saved: 'Guardado',
    syncing: 'A sincronizar…',
    saving: 'A guardar...',
    save: 'Guardar',
    panelUpload: 'Upload de Ficheiros',
    labelMaxSize: 'Tamanho Máximo de Upload (MB)',
    labelFormats: 'Formatos Permitidos',
    panelProcessing: 'Processamento de Imagens',
    autoCompress: 'Compressão automática',
    autoCompressDesc: 'Comprimir imagens no upload',
    labelQuality: 'Qualidade da Compressão (%)',
    createThumbnails: 'Criar miniaturas',
    createThumbnailsDesc: 'Gerar versões reduzidas automaticamente',
    labelThumbSize: 'Tamanho da Miniatura (px)',
  },
  fr: {
    title: 'Paramètres médias',
    subtitle: "Configurez les options de téléchargement et de traitement des images",
    saved: 'Enregistré',
    syncing: 'Synchronisation…',
    saving: 'Enregistrement...',
    save: 'Enregistrer',
    panelUpload: 'Téléchargement de fichiers',
    labelMaxSize: 'Taille maximale de téléchargement (Mo)',
    labelFormats: 'Formats autorisés',
    panelProcessing: 'Traitement des images',
    autoCompress: 'Compression automatique',
    autoCompressDesc: 'Compresser les images lors du téléchargement',
    labelQuality: 'Qualité de compression (%)',
    createThumbnails: 'Créer des miniatures',
    createThumbnailsDesc: 'Générer des versions réduites automatiquement',
    labelThumbSize: 'Taille de la miniature (px)',
  },
  en: {
    title: 'Media Settings',
    subtitle: 'Configure upload and image processing options',
    saved: 'Saved',
    syncing: 'Syncing…',
    saving: 'Saving...',
    save: 'Save',
    panelUpload: 'File Upload',
    labelMaxSize: 'Maximum Upload Size (MB)',
    labelFormats: 'Allowed Formats',
    panelProcessing: 'Image Processing',
    autoCompress: 'Auto-compress',
    autoCompressDesc: 'Compress images on upload',
    labelQuality: 'Compression Quality (%)',
    createThumbnails: 'Create thumbnails',
    createThumbnailsDesc: 'Generate reduced versions automatically',
    labelThumbSize: 'Thumbnail Size (px)',
  },
} as const;

export default function DefinicoesMediaPage() {
  const { settings, setSettings, loading, saving, savedAt, error, save } = useSettings(DEFAULTS);
  const { locale } = useLanguage();
  const t = copy[locale];

  const toggleFormat = (format: string) => {
    const current = settings.allowedFormats as string[];
    const updated = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    setSettings({ ...settings, allowedFormats: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save();
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSubmit}>
        <div className="settings-header">
          <div className="settings-title-group">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {savedAt && !saving && (
              <span className="settings-saved-badge">
                <CheckCircle size={14} /> {t.saved}
              </span>
            )}
            {error && <span className="settings-error-badge">{error}</span>}
            {loading && (
              <span className="settings-saved-badge" style={{ opacity: 0.75 }}>
                <Loader2 className="w-4 h-4 spin" /> {t.syncing}
              </span>
            )}
            <button type="submit" className="btn-save-settings" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>

        <div className="settings-layout-stack">
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Upload /> {t.panelUpload}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="form-field-group">
                <label>{t.labelMaxSize}</label>
                <input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) || 10 })}
                  className="form-input-text"
                  min={1}
                  max={500}
                />
              </div>

              <div className="form-field-group">
                <label>{t.labelFormats}</label>
                <div className="format-pills-container">
                  {['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx'].map((format) => {
                    const allowed = settings.allowedFormats as string[];
                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() => toggleFormat(format)}
                        className={`format-pill-btn ${allowed.includes(format) ? 'active' : ''}`}
                      >
                        {format.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Image /> {t.panelProcessing}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.autoCompress}</p>
                  <p className="switch-desc">{t.autoCompressDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoCompress}
                    onChange={(e) => setSettings({ ...settings, autoCompress: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>

              {settings.autoCompress && (
                <div className="form-field-group">
                  <label>{t.labelQuality}</label>
                  <div className="range-slider-container">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.compressQuality}
                      onChange={(e) => setSettings({ ...settings, compressQuality: parseInt(e.target.value) })}
                      className="range-slider"
                    />
                    <span className="range-slider-value">{settings.compressQuality}%</span>
                  </div>
                </div>
              )}

              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.createThumbnails}</p>
                  <p className="switch-desc">{t.createThumbnailsDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.createThumbnails}
                    onChange={(e) => setSettings({ ...settings, createThumbnails: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>

              {settings.createThumbnails && (
                <div className="form-field-group">
                  <label>{t.labelThumbSize}</label>
                  <input
                    type="number"
                    value={settings.thumbnailSize}
                    onChange={(e) => setSettings({ ...settings, thumbnailSize: parseInt(e.target.value) || 300 })}
                    className="form-input-text"
                    min={50}
                    max={2000}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
