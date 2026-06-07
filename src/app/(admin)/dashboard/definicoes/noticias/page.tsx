'use client';

import React from 'react';
import { Newspaper, Save, Settings, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import '../definicoes.css';

const DEFAULTS = {
  postsPerPage: 10,
  defaultCategory: 'Agricultura',
  enableComments: true,
  moderateComments: true,
  autoPublish: false,
  notifyOnNewPost: true,
};

const copy = {
  pt: {
    title: 'Definições de Notícias',
    subtitle: 'Configure as opções de publicação de notícias',
    saved: 'Guardado',
    syncing: 'A sincronizar…',
    saving: 'A guardar...',
    save: 'Guardar',
    panelPublish: 'Configurações de Publicação',
    labelPerPage: 'Notícias por Página',
    labelDefaultCat: 'Categoria Padrão',
    panelModeration: 'Opções de Moderação',
    switches: [
      { key: 'enableComments', label: 'Ativar comentários', desc: 'Permitir comentários nas notícias' },
      { key: 'moderateComments', label: 'Moderar comentários', desc: 'Comentários aguardam aprovação' },
      { key: 'autoPublish', label: 'Publicação automática', desc: 'Publicar imediatamente sem revisão' },
      { key: 'notifyOnNewPost', label: 'Notificar novas notícias', desc: 'Enviar email quando houver nova notícia' },
    ],
  },
  fr: {
    title: 'Paramètres des actualités',
    subtitle: 'Configurez les options de publication des actualités',
    saved: 'Enregistré',
    syncing: 'Synchronisation…',
    saving: 'Enregistrement...',
    save: 'Enregistrer',
    panelPublish: 'Paramètres de publication',
    labelPerPage: 'Actualités par page',
    labelDefaultCat: 'Catégorie par défaut',
    panelModeration: 'Options de modération',
    switches: [
      { key: 'enableComments', label: 'Activer les commentaires', desc: 'Autoriser les commentaires sur les actualités' },
      { key: 'moderateComments', label: 'Modérer les commentaires', desc: 'Les commentaires attendent une approbation' },
      { key: 'autoPublish', label: 'Publication automatique', desc: 'Publier immédiatement sans révision' },
      { key: 'notifyOnNewPost', label: 'Notifier les nouvelles', desc: 'Envoyer un e-mail pour chaque nouvelle actualité' },
    ],
  },
  en: {
    title: 'News Settings',
    subtitle: 'Configure news publishing options',
    saved: 'Saved',
    syncing: 'Syncing…',
    saving: 'Saving...',
    save: 'Save',
    panelPublish: 'Publishing Settings',
    labelPerPage: 'News per Page',
    labelDefaultCat: 'Default Category',
    panelModeration: 'Moderation Options',
    switches: [
      { key: 'enableComments', label: 'Enable comments', desc: 'Allow comments on news' },
      { key: 'moderateComments', label: 'Moderate comments', desc: 'Comments await approval' },
      { key: 'autoPublish', label: 'Auto-publish', desc: 'Publish immediately without review' },
      { key: 'notifyOnNewPost', label: 'Notify on new news', desc: 'Send email when there is a new article' },
    ],
  },
} as const;

export default function DefinicoesNoticiasPage() {
  const { settings, setSettings, loading, saving, savedAt, error, save } = useSettings(DEFAULTS);
  const { locale } = useLanguage();
  const t = copy[locale];

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
              <h2><Newspaper /> {t.panelPublish}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="grid-col-1-2">
                <div className="form-field-group">
                  <label>{t.labelPerPage}</label>
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
                  <label>{t.labelDefaultCat}</label>
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
              <h2><Settings /> {t.panelModeration}</h2>
            </div>
            <div className="settings-panel-body">
              {t.switches.map((item) => (
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
      </form>
    </div>
  );
}
