'use client';

import React from 'react';
import { Users, Save, UserPlus, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import '../definicoes.css';

const DEFAULTS = {
  allowRegistration: true,
  requireEmailVerification: true,
  defaultRole: 'subscriber',
  disableInactiveUsers: false,
  sessionTimeout: 60,
};

const copy = {
  pt: {
    title: 'Definições de Utilizadores',
    subtitle: 'Configure as opções de registo e acesso',
    saved: 'Guardado',
    syncing: 'A sincronizar…',
    saving: 'A guardar...',
    save: 'Guardar',
    panelRegistration: 'Registo de Utilizadores',
    allowReg: 'Permitir novos registos',
    allowRegDesc: 'Utilizadores podem criar contas',
    requireEmail: 'Verificação de email obrigatória',
    requireEmailDesc: 'Novos utilizadores devem confirmar email',
    panelRoles: 'Configurações de Papel',
    defaultRoleLabel: 'Papel Padrão para Novos Registos',
    roleSubscriber: 'Subscritor',
    roleContribuidor: 'Contribuidor',
    roleEditor: 'Editor',
    panelSession: 'Segurança de Sessão',
    sessionTimeout: 'Timeout de Sessão (minutos)',
    sessionTimeoutDesc: 'Tempo de inatividade antes de terminar a sessão',
    disableInactive: 'Desativar utilizadores inativos',
    disableInactiveDesc: 'Desativar contas após 90 dias de inatividade',
  },
  fr: {
    title: 'Paramètres utilisateurs',
    subtitle: "Configurez les options d'inscription et d'accès",
    saved: 'Enregistré',
    syncing: 'Synchronisation…',
    saving: 'Enregistrement...',
    save: 'Enregistrer',
    panelRegistration: 'Inscription des utilisateurs',
    allowReg: 'Autoriser les nouvelles inscriptions',
    allowRegDesc: 'Les utilisateurs peuvent créer des comptes',
    requireEmail: 'Vérification e-mail obligatoire',
    requireEmailDesc: 'Les nouveaux utilisateurs doivent confirmer leur e-mail',
    panelRoles: 'Paramètres de rôle',
    defaultRoleLabel: 'Rôle par défaut pour les nouvelles inscriptions',
    roleSubscriber: 'Abonné',
    roleContribuidor: 'Contributeur',
    roleEditor: 'Éditeur',
    panelSession: 'Sécurité de session',
    sessionTimeout: 'Délai de session (minutes)',
    sessionTimeoutDesc: "Temps d'inactivité avant de terminer la session",
    disableInactive: 'Désactiver les utilisateurs inactifs',
    disableInactiveDesc: 'Désactiver les comptes après 90 jours d\'inactivité',
  },
  en: {
    title: 'User Settings',
    subtitle: 'Configure registration and access options',
    saved: 'Saved',
    syncing: 'Syncing…',
    saving: 'Saving...',
    save: 'Save',
    panelRegistration: 'User Registration',
    allowReg: 'Allow new registrations',
    allowRegDesc: 'Users can create accounts',
    requireEmail: 'Email verification required',
    requireEmailDesc: 'New users must confirm their email',
    panelRoles: 'Role Settings',
    defaultRoleLabel: 'Default Role for New Registrations',
    roleSubscriber: 'Subscriber',
    roleContribuidor: 'Contributor',
    roleEditor: 'Editor',
    panelSession: 'Session Security',
    sessionTimeout: 'Session Timeout (minutes)',
    sessionTimeoutDesc: 'Inactivity time before ending the session',
    disableInactive: 'Disable inactive users',
    disableInactiveDesc: 'Disable accounts after 90 days of inactivity',
  },
} as const;

export default function DefinicoesUtilizadoresPage() {
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
              <h2><UserPlus /> {t.panelRegistration}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.allowReg}</p>
                  <p className="switch-desc">{t.allowRegDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistration}
                    onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>

              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.requireEmail}</p>
                  <p className="switch-desc">{t.requireEmailDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Users /> {t.panelRoles}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="form-field-group">
                <label>{t.defaultRoleLabel}</label>
                <select
                  value={settings.defaultRole}
                  onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                  className="form-select"
                >
                  <option value="subscriber">{t.roleSubscriber}</option>
                  <option value="contribuidor">{t.roleContribuidor}</option>
                  <option value="editor">{t.roleEditor}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Mail /> {t.panelSession}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="form-field-group">
                <label>{t.sessionTimeout}</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })}
                  className="form-input-text"
                  min={5}
                />
                <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                  {t.sessionTimeoutDesc}
                </p>
              </div>

              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.disableInactive}</p>
                  <p className="switch-desc">{t.disableInactiveDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.disableInactiveUsers}
                    onChange={(e) => setSettings({ ...settings, disableInactiveUsers: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
