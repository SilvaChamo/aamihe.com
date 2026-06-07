'use client';

import React from 'react';
import { Shield, Save, Lock, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import '../definicoes.css';

const DEFAULTS = {
  forceHTTPS: true,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  requireStrongPassword: true,
  twoFactorAuth: false,
  ipWhitelist: '',
};

export default function DefinicoesSegurancaPage() {
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
            <h1>Definições de Segurança</h1>
            <p>Configure as opções de segurança do sistema</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {savedAt && !saving && (
              <span className="settings-saved-badge">
                <CheckCircle size={14} /> Guardado
              </span>
            )}
            {error && <span className="settings-error-badge">{error}</span>}
            {loading && (
              <span className="settings-saved-badge" style={{ opacity: 0.75 }}>
                <Loader2 className="w-4 h-4 spin" /> A sincronizar…
              </span>
            )}
            <button type="submit" className="btn-save-settings" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>

        <div className="settings-layout-stack">
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Lock /> Proteção de Acesso</h2>
              </div>
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Forçar HTTPS</p>
                    <p className="switch-desc">Redirecionar todas as requisições para HTTPS</p>
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
                    <label>Tentativas de Login Máximas</label>
                    <input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                      className="form-input-text"
                      min={1}
                    />
                    <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                      Número de tentativas antes de bloquear
                    </p>
                  </div>
                  <div className="form-field-group">
                    <label>Duração do Bloqueio (minutos)</label>
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
                <h2><Shield /> Passwords</h2>
              </div>
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Exigir password forte</p>
                    <p className="switch-desc">Mínimo 8 caracteres, letras, números e símbolos</p>
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
                <h2><Smartphone /> Autenticação de Dois Fatores</h2>
              </div>
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Ativar 2FA</p>
                    <p className="switch-desc">Requerer código adicional no login</p>
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
                <h2>Whitelist de IP</h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>IPs Permitidos (um por linha)</label>
                  <textarea
                    value={settings.ipWhitelist}
                    onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                    rows={4}
                    placeholder={'192.168.1.1\n10.0.0.1'}
                    className="form-textarea"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                    Deixe em branco para permitir todos os IPs
                  </p>
                </div>
              </div>
            </div>
          </div>
      </form>
    </div>
  );
}
