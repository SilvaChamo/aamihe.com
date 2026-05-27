'use client';

import React from 'react';
import { Newspaper, Save, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import '../definicoes.css';

const DEFAULTS = {
  postsPerPage: 10,
  defaultCategory: 'Agricultura',
  enableComments: true,
  moderateComments: true,
  autoPublish: false,
  notifyOnNewPost: true,
};

export default function DefinicoesNoticiasPage() {
  const { settings, setSettings, loading, saving, savedAt, error, save } = useSettings(DEFAULTS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save();
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSubmit}>
        <div className="settings-header">
          <div className="settings-title-group">
            <h1>Definições de Notícias</h1>
            <p>Configure as opções de publicação de notícias</p>
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
                <h2><Newspaper /> Configurações de Publicação</h2>
              </div>
              <div className="settings-panel-body">
                <div className="grid-col-1-2">
                  <div className="form-field-group">
                    <label>Notícias por Página</label>
                    <input
                      type="number"
                      value={settings.postsPerPage}
                      onChange={(e) => setSettings({ ...settings, postsPerPage: parseInt(e.target.value) || 10 })}
                      className="form-input-text"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Categoria Padrão</label>
                    <select
                      value={settings.defaultCategory}
                      onChange={(e) => setSettings({ ...settings, defaultCategory: e.target.value })}
                      className="form-select"
                    >
                      <option>Agricultura</option>
                      <option>Comunidade</option>
                      <option>Ambiente</option>
                      <option>Agro-negócio</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Settings /> Opções de Moderação</h2>
              </div>
              <div className="settings-panel-body">
                {[
                  { key: 'enableComments', label: 'Ativar comentários', desc: 'Permitir comentários nas notícias' },
                  { key: 'moderateComments', label: 'Moderar comentários', desc: 'Comentários aguardam aprovação' },
                  { key: 'autoPublish', label: 'Publicação automática', desc: 'Publicar imediatamente sem revisão' },
                  { key: 'notifyOnNewPost', label: 'Notificar novas notícias', desc: 'Enviar email quando houver nova notícia' },
                ].map((item) => (
                  <div key={item.key} className="switch-field-row">
                    <div className="switch-field-label">
                      <p className="switch-title">{item.label}</p>
                      <p className="switch-desc">{item.desc}</p>
                    </div>
                    <label className="ios-toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings[item.key as keyof typeof settings] as boolean}
                        onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                      />
                      <span className="ios-toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
