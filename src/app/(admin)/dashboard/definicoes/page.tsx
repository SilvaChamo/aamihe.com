'use client';

import React from 'react';
import {
  Globe,
  Save,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import './definicoes.css';

const DEFAULTS = {
  siteName: 'AAMIHE',
  siteDescription: 'Associação de Apoio a Migrantes e Imigrantes em Hotéis e Empreendimentos',
  logoUrl: '',
  faviconUrl: '',
  contactEmail: 'admin@aamihe.com',
  contactPhone: '',
  address: '',
  googleAnalyticsId: '',
  maintenanceMode: false,
};

export default function DefinicoesGeraisPage() {
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
            <h1>Definições Gerais</h1>
            <p>Configure as informações básicas do site</p>
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
            {/* Site Info */}
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Globe /> Informações do Site</h2>
              </div>
              <div className="settings-panel-body">
                <div className="form-field-group">
                  <label>Nome do Site</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="form-input-text"
                  />
                </div>
                <div className="form-field-group">
                  <label>Descrição</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows={3}
                    className="form-textarea"
                  />
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><ImageIcon /> Identidade Visual</h2>
              </div>
              <div className="settings-panel-body">
                <div className="grid-col-1-2">
                  <div className="form-field-group">
                    <label>Logotipo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input-text"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Favicon</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input-text"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Mail /> Contactos</h2>
              </div>
              <div className="settings-panel-body">
                <div className="grid-col-1-2">
                  <div className="form-field-group">
                    <label><Mail className="w-4 h-4" /> Email</label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      className="form-input-text"
                    />
                  </div>
                  <div className="form-field-group">
                    <label><Phone className="w-4 h-4" /> Telefone</label>
                    <input
                      type="tel"
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="form-input-text"
                    />
                  </div>
                  <div className="form-field-group" style={{ gridColumn: '1 / -1' }}>
                    <label><MapPin className="w-4 h-4" /> Endereço</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="form-input-text"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className="settings-panel">
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Modo de Manutenção</p>
                    <p className="switch-desc">Ativar modo de manutenção (apenas admins podem aceder)</p>
                  </div>
                  <label className="ios-toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    />
                    <span className="ios-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
