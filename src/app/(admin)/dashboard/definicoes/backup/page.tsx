'use client';

import React from 'react';
import {
  Database, Download, Upload, Calendar, Clock, Save, Trash2,
  CheckCircle, Loader2,
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import '../definicoes.css';

const DEFAULTS = {
  autoBackup: true,
  backupFrequency: 'daily',
  backupTime: '02:00',
  keepBackups: 7,
  includeMedia: true,
  lastBackup: '2026-04-26 02:00:00',
};

const backups = [
  { id: 1, date: '2026-04-26 02:00', size: '156 MB', type: 'Automático' },
  { id: 2, date: '2026-04-25 02:00', size: '154 MB', type: 'Automático' },
  { id: 3, date: '2026-04-24 02:00', size: '153 MB', type: 'Automático' },
  { id: 4, date: '2026-04-20 14:30', size: '150 MB', type: 'Manual' },
];

export default function DefinicoesBackupPage() {
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
            <h1>Backup e Restauração</h1>
            <p>Configure backups automáticos e restaure dados</p>
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
            {/* Backup Now */}
            <div className="backup-now-card">
              <div className="backup-now-info">
                <h2>Backup Manual</h2>
                <p>Último backup: {settings.lastBackup}</p>
              </div>
              <button
                type="button"
                className="btn-backup-now"
                onClick={() => alert('Backup iniciado com sucesso!')}
              >
                <Database className="w-5 h-5" /> Fazer Backup Agora
              </button>
            </div>

            {/* Auto Backup Settings */}
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Clock /> Backup Automático</h2>
              </div>
              <div className="settings-panel-body">
                <div className="switch-field-row">
                  <div className="switch-field-label">
                    <p className="switch-title">Ativar backups automáticos</p>
                    <p className="switch-desc">Criar backups periodicamente</p>
                  </div>
                  <label className="ios-toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                    />
                    <span className="ios-toggle-slider"></span>
                  </label>
                </div>

                {settings.autoBackup && (
                  <>
                    <div className="grid-col-1-2" style={{ marginTop: '16px' }}>
                      <div className="form-field-group">
                        <label>Frequência</label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                          className="form-select"
                        >
                          <option value="hourly">A cada hora</option>
                          <option value="daily">Diariamente</option>
                          <option value="weekly">Semanalmente</option>
                          <option value="monthly">Mensalmente</option>
                        </select>
                      </div>
                      <div className="form-field-group">
                        <label>Hora</label>
                        <input
                          type="time"
                          value={settings.backupTime}
                          onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })}
                          className="form-input-text"
                        />
                      </div>
                    </div>

                    <div className="form-field-group" style={{ marginTop: '16px' }}>
                      <label>Manter últimos backups</label>
                      <input
                        type="number"
                        value={settings.keepBackups}
                        onChange={(e) => setSettings({ ...settings, keepBackups: parseInt(e.target.value) || 7 })}
                        className="form-input-text"
                        min={1}
                        max={365}
                      />
                    </div>

                    <div className="switch-field-row">
                      <div className="switch-field-label">
                        <p className="switch-title">Incluir media</p>
                        <p className="switch-desc">Fazer backup de imagens e ficheiros</p>
                      </div>
                      <label className="ios-toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.includeMedia}
                          onChange={(e) => setSettings({ ...settings, includeMedia: e.target.checked })}
                        />
                        <span className="ios-toggle-slider"></span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Backup List */}
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Calendar /> Histórico de Backups</h2>
              </div>
              <div className="settings-panel-body">
                <div className="settings-table-container">
                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Tamanho</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.id}>
                          <td>{backup.date}</td>
                          <td>
                            <span className={`badge-backup-type ${backup.type === 'Automático' ? 'auto' : 'manual'}`}>
                              {backup.type}
                            </span>
                          </td>
                          <td>{backup.size}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button type="button" className="btn-icon" style={{ width: '30px', height: '30px', marginRight: '6px' }} title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                            <button type="button" className="btn-icon danger" style={{ width: '30px', height: '30px' }} title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Restore */}
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Upload /> Restaurar Backup</h2>
              </div>
              <div className="settings-panel-body">
                <div className="restore-dropzone">
                  <Upload className="restore-dropzone-icon" />
                  <p>Arraste um ficheiro de backup ou clique para selecionar</p>
                  <input type="file" accept=".zip,.sql" className="screen-reader-text" id="restore-file" />
                  <label htmlFor="restore-file" className="btn-upload-file">
                    Selecionar Ficheiro
                  </label>
                </div>
                <div className="alert-box warning" style={{ marginTop: '16px' }}>
                  ⚠️ A restauração substituirá todos os dados atuais do sistema. Proceda com cuidado.
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
