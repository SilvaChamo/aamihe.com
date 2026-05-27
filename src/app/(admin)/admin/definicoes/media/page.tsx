'use client';

import React from 'react';
import { Image, Save, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import '../definicoes.css';

const DEFAULTS = {
  maxUploadSize: 10,
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'] as string[],
  autoCompress: true,
  compressQuality: 80,
  createThumbnails: true,
  thumbnailSize: 300,
};

export default function DefinicoesMediaPage() {
  const { settings, setSettings, loading, saving, savedAt, error, save } = useSettings(DEFAULTS);

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
            <h1>Definições de Media</h1>
            <p>Configure as opções de upload e processamento de imagens</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {savedAt && !saving && (
              <span className="settings-saved-badge">
                <CheckCircle size={14} /> Guardado
              </span>
            )}
            {error && <span className="settings-error-badge">{error}</span>}
            <button type="submit" className="btn-save-settings" disabled={saving || loading}>
              {saving ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="settings-loading">
            <Loader2 className="spin" size={24} /> A carregar definições...
          </div>
        ) : (
          <div className="settings-layout-stack">
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Upload /> Upload de Ficheiros</h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>Tamanho Máximo de Upload (MB)</label>
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
                  <label>Formatos Permitidos</label>
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
                <h2><Image /> Processamento de Imagens</h2>
              </div>
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Compressão automática</p>
                    <p className="switch-desc">Comprimir imagens no upload</p>
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
                    <label>Qualidade da Compressão (%)</label>
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
                    <p className="switch-title">Criar miniaturas</p>
                    <p className="switch-desc">Gerar versões reduzidas automaticamente</p>
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
                    <label>Tamanho da Miniatura (px)</label>
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
        )}
      </form>
    </div>
  );
}
