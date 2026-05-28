'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  CloudUpload,
  Clock,
  Database,
  Download,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import { useSettings } from '@/hooks/useSettings';

type BackupType = 'Automático' | 'Manual';

type BackupEntry = {
  id: string;
  date: string;
  size: string;
  type: BackupType;
  storagePath?: string;
  payload?: string;
};

type BackupSettings = {
  autoBackup: boolean;
  backupFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  backupTime: string;
  keepBackups: number;
  includeMedia: boolean;
  lastBackup: string;
  backupHistory: BackupEntry[];
};

const DEFAULTS: BackupSettings = {
  autoBackup: true,
  backupFrequency: 'daily',
  backupTime: '02:00',
  keepBackups: 7,
  includeMedia: true,
  lastBackup: 'Nunca',
  backupHistory: [],
};

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function BackupSettingsPage() {
  const { settings, setSettings, loading, saving, savedAt, error, save } = useSettings(DEFAULTS);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [runningBackup, setRunningBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [driveBusyId, setDriveBusyId] = useState('');
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const history = useMemo(
    () => (Array.isArray(settings.backupHistory) ? settings.backupHistory : []) as BackupEntry[],
    [settings.backupHistory]
  );

  const persist = async (next: BackupSettings) => {
    setSettings(next);
    await save(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    await save();
  };

  const handleBackupNow = async () => {
    setRunningBackup(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await adminFetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.backup) {
        throw new Error(data?.error || 'Erro ao criar backup');
      }
      const entry = data.backup as BackupEntry;
      const limit = Math.max(1, Number(settings.keepBackups) || 7);
      const backupHistory = [entry, ...history].slice(0, limit);
      await persist({
        ...(settings as BackupSettings),
        lastBackup: entry.date,
        backupHistory,
      });
      setActionSuccess('Backup completo criado (site, BD, notícias, media e utilizadores).');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao criar backup. Tente novamente.');
    } finally {
      setRunningBackup(false);
    }
  };

  const getBackupBlob = async (backup: BackupEntry) => {
    if (backup.storagePath) {
      const res = await adminFetch(`/api/admin/backup?path=${encodeURIComponent(backup.storagePath)}`, {
        method: 'GET',
      });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info?.error || 'Erro ao baixar backup.');
      }
      return res.blob();
    }

    const parsedPayload = backup.payload ? JSON.parse(backup.payload) : {};
    return new Blob([JSON.stringify(parsedPayload, null, 2)], { type: 'application/json' });
  };

  const handleDownload = async (backup: BackupEntry) => {
    setActionError('');
    setActionSuccess('');
    try {
      const blob = await getBackupBlob(backup);
      const safeDate = backup.date.replace(/[^\d]/g, '').slice(0, 12);
      downloadBlob(`aamihe-backup-${safeDate || backup.id}.json`, blob);
      setActionSuccess('Backup exportado para o seu computador.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao baixar backup.');
    }
  };

  const handleDeleteBackup = async (backup: BackupEntry) => {
    setActionError('');
    setActionSuccess('');
    try {
      if (backup.storagePath) {
        const res = await adminFetch('/api/admin/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', path: backup.storagePath }),
        });
        if (!res.ok) {
          const info = await res.json().catch(() => ({}));
          throw new Error(info?.error || 'Erro ao eliminar backup.');
        }
      }
      const backupHistory = history.filter((item) => item.id !== backup.id);
      await persist({
        ...(settings as BackupSettings),
        backupHistory,
      });
      setActionSuccess('Backup removido com sucesso.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao eliminar backup.');
    }
  };

  const handleRestoreFromHistory = async (backup: BackupEntry) => {
    setActionError('');
    setActionSuccess('');
    setRestoring(true);
    try {
      if (backup.storagePath) {
        const res = await adminFetch('/api/admin/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore', path: backup.storagePath }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Não foi possível restaurar este backup.');
        }
      } else if (backup.payload) {
        const parsed = JSON.parse(backup.payload);
        const res = await adminFetch('/api/admin/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'restore', payload: parsed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Não foi possível restaurar este backup.');
        }
      } else {
        throw new Error('Backup sem conteúdo.');
      }
      setActionSuccess('Site restaurado com sucesso a partir do backup selecionado.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível restaurar este backup.');
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setActionError('');
    setActionSuccess('');

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const res = await adminFetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', payload: parsed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Ficheiro de backup inválido.');
      }
      setActionSuccess('Restauração completa concluída e sincronizada com sucesso.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Ficheiro de backup inválido.');
    } finally {
      if (restoreInputRef.current) {
        restoreInputRef.current.value = '';
      }
      setRestoring(false);
    }
  };

  const ensureGoogleScript = async () => {
    if (typeof window === 'undefined') throw new Error('Google Drive indisponível fora do browser.');
    if (window.google?.accounts?.oauth2) return;
    await new Promise<void>((resolve, reject) => {
      const id = 'google-identity-services';
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Não foi possível carregar integração Google.'));
      document.body.appendChild(script);
    });
  };

  const getGoogleAccessToken = async () => {
    await ensureGoogleScript();
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Defina NEXT_PUBLIC_GOOGLE_CLIENT_ID para ativar Google Drive.');
    }
    return new Promise<string>((resolve, reject) => {
      const client = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (resp: { access_token?: string; error?: string }) => {
          if (resp.error || !resp.access_token) {
            reject(new Error('Falha de autenticação Google Drive.'));
            return;
          }
          resolve(resp.access_token);
        },
      });
      if (!client) {
        reject(new Error('Google OAuth indisponível.'));
        return;
      }
      client.requestAccessToken({ prompt: 'select_account consent' });
    });
  };

  const uploadBlobToGoogleDrive = async (fileName: string, blob: Blob) => {
    const accessToken = await getGoogleAccessToken();
    const metadata = { name: fileName, mimeType: 'application/json' };
    const boundary = 'aamihe_backup_boundary';
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      await blob.text(),
      `--${boundary}--`,
    ].join('\r\n');

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Falha ao guardar no Google Drive. ${text}`);
    }
  };

  const handleSaveToDrive = async (backup: BackupEntry) => {
    setActionError('');
    setActionSuccess('');
    setDriveBusyId(backup.id);
    try {
      const blob = await getBackupBlob(backup);
      const safeDate = backup.date.replace(/[^\d]/g, '').slice(0, 12);
      const fileName = `aamihe-backup-${safeDate || backup.id}.json`;
      await uploadBlobToGoogleDrive(fileName, blob);
      setActionSuccess('Backup guardado no Google Drive com sucesso.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao guardar no Google Drive.');
    } finally {
      setDriveBusyId('');
    }
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
            <div className="backup-now-card">
              <div className="backup-now-info">
                <h2>Backup Manual</h2>
                <p>Último backup: {String(settings.lastBackup || 'Nunca')}</p>
              </div>
              <button type="button" className="btn-backup-now" onClick={handleBackupNow} disabled={runningBackup || saving}>
                {runningBackup ? <Loader2 className="w-5 h-5 spin" /> : <Database className="w-5 h-5" />}
                {runningBackup ? 'A criar backup...' : 'Fazer Backup Agora'}
              </button>
            </div>

            {(actionError || actionSuccess) && (
              <div className={`alert-box ${actionError ? 'warning' : ''}`}>
                {actionError || actionSuccess}
              </div>
            )}

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
                      checked={Boolean(settings.autoBackup)}
                      onChange={(e) => setSettings({ ...(settings as BackupSettings), autoBackup: e.target.checked })}
                    />
                    <span className="ios-toggle-slider"></span>
                  </label>
                </div>

                {Boolean(settings.autoBackup) && (
                  <>
                    <div className="grid-col-1-3" style={{ marginTop: '16px' }}>
                      <div className="form-field-group">
                        <label>Frequência</label>
                        <select
                          value={String(settings.backupFrequency || 'daily')}
                          onChange={(e) => setSettings({ ...(settings as BackupSettings), backupFrequency: e.target.value as BackupSettings['backupFrequency'] })}
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
                          value={String(settings.backupTime || '02:00')}
                          onChange={(e) => setSettings({ ...(settings as BackupSettings), backupTime: e.target.value })}
                          className="form-input-text"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Manter últimos backups</label>
                        <input
                          type="number"
                          value={Number(settings.keepBackups || 7)}
                          onChange={(e) =>
                            setSettings({
                              ...(settings as BackupSettings),
                              keepBackups: Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 7)),
                            })
                          }
                          className="form-input-text"
                          min={1}
                          max={365}
                        />
                      </div>
                    </div>

                    <div className="switch-field-row">
                      <div className="switch-field-label">
                        <p className="switch-title">Incluir media</p>
                        <p className="switch-desc">Fazer backup de imagens e ficheiros</p>
                      </div>
                      <label className="ios-toggle-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(settings.includeMedia)}
                          onChange={(e) => setSettings({ ...(settings as BackupSettings), includeMedia: e.target.checked })}
                        />
                        <span className="ios-toggle-slider"></span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

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
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={4}>Sem backups ainda. Clique em "Fazer Backup Agora".</td>
                        </tr>
                      ) : (
                        history.map((backup) => (
                          <tr key={backup.id}>
                            <td>{backup.date}</td>
                            <td>
                              <span className={`badge-backup-type ${backup.type === 'Automático' ? 'auto' : 'manual'}`}>
                                {backup.type}
                              </span>
                            </td>
                            <td>{backup.size}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ width: '30px', height: '30px', marginRight: '6px' }}
                                title="Download"
                                onClick={() => handleDownload(backup)}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ width: '30px', height: '30px', marginRight: '6px' }}
                                title="Guardar no Google Drive"
                                onClick={() => handleSaveToDrive(backup)}
                                disabled={driveBusyId === backup.id}
                              >
                                {driveBusyId === backup.id ? <Loader2 className="w-4 h-4 spin" /> : <CloudUpload className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ width: '30px', height: '30px', marginRight: '6px' }}
                                title="Restaurar"
                                onClick={() => handleRestoreFromHistory(backup)}
                                disabled={restoring}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                className="btn-icon danger"
                                style={{ width: '30px', height: '30px' }}
                                title="Eliminar"
                                onClick={() => handleDeleteBackup(backup)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2><Upload /> Restaurar Backup</h2>
              </div>
              <div className="settings-panel-body">
                <div className="restore-dropzone">
                  <Upload className="restore-dropzone-icon" />
                  <p>Arraste um ficheiro de backup ou clique para selecionar</p>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept=".json"
                    className="screen-reader-text"
                    id="restore-file"
                    onChange={handleRestoreFile}
                    disabled={restoring}
                  />
                  <label htmlFor="restore-file" className="btn-upload-file">
                    {restoring ? 'A restaurar...' : 'Selecionar Ficheiro'}
                  </label>
                </div>
                <div className="alert-box warning" style={{ marginTop: '16px' }}>
                  ⚠️ A restauração substituirá o estado atual completo do site (conteúdo, BD, media e utilizadores).
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (opts?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}
