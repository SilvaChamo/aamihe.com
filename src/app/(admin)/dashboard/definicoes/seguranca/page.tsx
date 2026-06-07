'use client';

import React from 'react';
import { Shield, Save, Lock, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useLanguage } from '@/context/LanguageContext';
import '../definicoes.css';

const DEFAULTS = {
  forceHTTPS: true,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  requireStrongPassword: true,
  twoFactorAuth: false,
  ipWhitelist: '',
};

const copy = {
  pt: {
    title: 'Definições de Segurança',
    subtitle: 'Configure as opções de segurança do sistema',
    saved: 'Guardado',
    syncing: 'A sincronizar…',
    saving: 'A guardar...',
    save: 'Guardar',
    panelAccess: 'Proteção de Acesso',
    forceHTTPS: 'Forçar HTTPS',
    forceHTTPSDesc: 'Redirecionar todas as requisições para HTTPS',
    labelMaxAttempts: 'Tentativas de Login Máximas',
    maxAttemptsNote: 'Número de tentativas antes de bloquear',
    labelLockout: 'Duração do Bloqueio (minutos)',
    panelPassword: 'Passwords',
    requireStrong: 'Exigir password forte',
    requireStrongDesc: 'Mínimo 8 caracteres, letras, números e símbolos',
    panel2FA: 'Autenticação de Dois Fatores',
    enable2FA: 'Ativar 2FA',
    enable2FADesc: 'Requerer código adicional no login',
    panelWhitelist: 'Whitelist de IP',
    labelIPs: 'IPs Permitidos (um por linha)',
    ipsNote: 'Deixe em branco para permitir todos os IPs',
  },
  fr: {
    title: 'Paramètres de sécurité',
    subtitle: 'Configurez les options de sécurité du système',
    saved: 'Enregistré',
    syncing: 'Synchronisation…',
    saving: 'Enregistrement...',
    save: 'Enregistrer',
    panelAccess: 'Protection des accès',
    forceHTTPS: 'Forcer HTTPS',
    forceHTTPSDesc: 'Rediriger toutes les requêtes vers HTTPS',
    labelMaxAttempts: 'Tentatives de connexion maximales',
    maxAttemptsNote: 'Nombre de tentatives avant le blocage',
    labelLockout: 'Durée du blocage (minutes)',
    panelPassword: 'Mots de passe',
    requireStrong: 'Exiger un mot de passe fort',
    requireStrongDesc: 'Minimum 8 caractères, lettres, chiffres et symboles',
    panel2FA: 'Authentification à deux facteurs',
    enable2FA: 'Activer 2FA',
    enable2FADesc: 'Demander un code supplémentaire lors de la connexion',
    panelWhitelist: 'Liste blanche IP',
    labelIPs: 'IP autorisées (une par ligne)',
    ipsNote: 'Laisser vide pour autoriser toutes les IP',
  },
  en: {
    title: 'Security Settings',
    subtitle: 'Configure system security options',
    saved: 'Saved',
    syncing: 'Syncing…',
    saving: 'Saving...',
    save: 'Save',
    panelAccess: 'Access Protection',
    forceHTTPS: 'Force HTTPS',
    forceHTTPSDesc: 'Redirect all requests to HTTPS',
    labelMaxAttempts: 'Maximum Login Attempts',
    maxAttemptsNote: 'Number of attempts before lockout',
    labelLockout: 'Lockout Duration (minutes)',
    panelPassword: 'Passwords',
    requireStrong: 'Require strong password',
    requireStrongDesc: 'Minimum 8 characters, letters, numbers, and symbols',
    panel2FA: 'Two-Factor Authentication',
    enable2FA: 'Enable 2FA',
    enable2FADesc: 'Require an additional code at login',
    panelWhitelist: 'IP Whitelist',
    labelIPs: 'Allowed IPs (one per line)',
    ipsNote: 'Leave blank to allow all IPs',
  },
} as const;

export default function DefinicoesSegurancaPage() {
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
              <h2><Lock /> {t.panelAccess}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.forceHTTPS}</p>
                  <p className="switch-desc">{t.forceHTTPSDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.forceHTTPS}
                    onChange={(e) => setSettings({ ...settings, forceHTTPS: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>

              <div className="grid-col-1-2">
                <div className="form-field-group">
                  <label>{t.labelMaxAttempts}</label>
                  <input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                    className="form-input-text"
                    min={1}
                  />
                  <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                    {t.maxAttemptsNote}
                  </p>
                </div>
                <div className="form-field-group">
                  <label>{t.labelLockout}</label>
                  <input
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) || 30 })}
                    className="form-input-text"
                    min={1}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Shield /> {t.panelPassword}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.requireStrong}</p>
                  <p className="switch-desc">{t.requireStrongDesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.requireStrongPassword}
                    onChange={(e) => setSettings({ ...settings, requireStrongPassword: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Smartphone /> {t.panel2FA}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="switch-field-row">
                <div className="switch-field-label">
                  <p className="switch-title">{t.enable2FA}</p>
                  <p className="switch-desc">{t.enable2FADesc}</p>
                </div>
                <label className="ios-toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                  />
                  <span className="ios-toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2>{t.panelWhitelist}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="form-field-group">
                <label>{t.labelIPs}</label>
                <textarea
                  value={settings.ipWhitelist}
                  onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                  rows={4}
                  placeholder={'192.168.1.1\n10.0.0.1'}
                  className="form-textarea"
                  style={{ fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                  {t.ipsNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
