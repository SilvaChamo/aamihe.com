'use client';

import React from 'react';
import { Users, Save, UserPlus, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import '../definicoes.css';

const DEFAULTS = {
  allowRegistration: true,
  requireEmailVerification: true,
  defaultRole: 'subscriber',
  disableInactiveUsers: false,
  sessionTimeout: 60,
};

export default function DefinicoesUtilizadoresPage() {
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
            <h1>Definições de Utilizadores</h1>
            <p>Configure as opções de registo e acesso</p>
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
                <h2><UserPlus /> Registo de Utilizadores</h2>
              </div>
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Permitir novos registos</p>
                    <p className="switch-desc">Utilizadores podem criar contas</p>
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
                    <p className="switch-title">Verificação de email obrigatória</p>
                    <p className="switch-desc">Novos utilizadores devem confirmar email</p>
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
                <h2><Users /> Configurações de Papel</h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>Papel Padrão para Novos Registos</label>
                  <select
                    value={settings.defaultRole}
                    onChange={(e) => setSettings({ ...settings, defaultRole: e.target.value })}
                    className="form-select"
                  >
                    <option value="subscriber">Subscritor</option>
                    <option value="contribuidor">Contribuidor</option>
                    <option value="editor">Editor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Mail /> Segurança de Sessão</h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>Timeout de Sessão (minutos)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 60 })}
                    className="form-input-text"
                    min={5}
                  />
                  <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                    Tempo de inatividade antes de terminar a sessão
                  </p>
                </div>

                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Desativar utilizadores inativos</p>
                    <p className="switch-desc">Desativar contas após 90 dias de inatividade</p>
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
