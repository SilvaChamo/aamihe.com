'use client';

import React, { useState } from 'react';
import { Code, Save, Key, Webhook, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import '../definicoes.css';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.visualdesignmoz.com';

const copy = {
  pt: {
    title: 'API & Integrações',
    subtitle: 'Configure chaves de API e webhooks',
    save: 'Guardar',
    panelApiKey: 'Chave de API',
    labelApiKey: 'API Key (Live)',
    titleCopy: 'Copiar',
    titleRegen: 'Regenerar',
    apiKeyNote: 'Use esta chave para autenticar as suas requisições à API',
    alertWarning: 'Atenção:',
    alertText: 'Mantenha a sua API Key segura. Não a partilhe em código client-side ou repositórios públicos.',
    panelDocs: 'Documentação da API',
    commentList: '// Exemplo: Listar notícias',
    commentCreate: '// Exemplo: Criar notícia',
    commentHeaders: 'Headers:',
    commentBody: 'Body:',
    viewDocs: 'Ver documentação completa →',
    panelWebhooks: 'Webhooks',
    webhooksDesc: 'Receba notificações em tempo real quando eventos ocorrerem no sistema.',
    placeholderUrl: 'URL do webhook',
    eventNewsCreated: 'Notícia criada',
    eventNewsUpdated: 'Notícia atualizada',
    eventUserRegistered: 'Utilizador registado',
    eventUserLogin: 'Login',
    add: 'Adicionar',
    panelRateLimits: 'Limites de Requisições',
    reqPerHour: 'Requisições/hora',
    uploadsPerHour: 'Uploads/hora',
    maxSize: 'Tamanho máximo',
    savedMsg: 'Definições de API guardadas com sucesso!',
    keyCopied: 'API Key copiada!',
  },
  fr: {
    title: 'API & Intégrations',
    subtitle: 'Configurez les clés API et les webhooks',
    save: 'Enregistrer',
    panelApiKey: 'Clé API',
    labelApiKey: 'Clé API (Live)',
    titleCopy: 'Copier',
    titleRegen: 'Régénérer',
    apiKeyNote: 'Utilisez cette clé pour authentifier vos requêtes API',
    alertWarning: 'Attention :',
    alertText: 'Gardez votre clé API sécurisée. Ne la partagez pas dans le code client ou les dépôts publics.',
    panelDocs: 'Documentation API',
    commentList: '// Exemple : Lister les actualités',
    commentCreate: '// Exemple : Créer une actualité',
    commentHeaders: 'En-têtes :',
    commentBody: 'Corps :',
    viewDocs: 'Voir la documentation complète →',
    panelWebhooks: 'Webhooks',
    webhooksDesc: 'Recevez des notifications en temps réel lorsque des événements se produisent.',
    placeholderUrl: 'URL du webhook',
    eventNewsCreated: 'Actualité créée',
    eventNewsUpdated: 'Actualité mise à jour',
    eventUserRegistered: 'Utilisateur inscrit',
    eventUserLogin: 'Connexion',
    add: 'Ajouter',
    panelRateLimits: 'Limites de requêtes',
    reqPerHour: 'Requêtes/heure',
    uploadsPerHour: 'Téléchargements/heure',
    maxSize: 'Taille maximale',
    savedMsg: 'Paramètres API enregistrés avec succès !',
    keyCopied: 'Clé API copiée !',
  },
  en: {
    title: 'API & Integrations',
    subtitle: 'Configure API keys and webhooks',
    save: 'Save',
    panelApiKey: 'API Key',
    labelApiKey: 'API Key (Live)',
    titleCopy: 'Copy',
    titleRegen: 'Regenerate',
    apiKeyNote: 'Use this key to authenticate your API requests',
    alertWarning: 'Warning:',
    alertText: 'Keep your API Key secure. Do not share it in client-side code or public repositories.',
    panelDocs: 'API Documentation',
    commentList: '// Example: List news',
    commentCreate: '// Example: Create news',
    commentHeaders: 'Headers:',
    commentBody: 'Body:',
    viewDocs: 'View full documentation →',
    panelWebhooks: 'Webhooks',
    webhooksDesc: 'Receive real-time notifications when events occur in the system.',
    placeholderUrl: 'Webhook URL',
    eventNewsCreated: 'News created',
    eventNewsUpdated: 'News updated',
    eventUserRegistered: 'User registered',
    eventUserLogin: 'Login',
    add: 'Add',
    panelRateLimits: 'Rate Limits',
    reqPerHour: 'Requests/hour',
    uploadsPerHour: 'Uploads/hour',
    maxSize: 'Max size',
    savedMsg: 'API settings saved successfully!',
    keyCopied: 'API Key copied!',
  },
} as const;

export default function DefinicoesAPIPage() {
  const { locale } = useLanguage();
  const t = copy[locale];

  const [apiKey, setApiKey] = useState('ec_live_sk_1234567890abcdef');
  const [webhooks, setWebhooks] = useState([
    { id: 1, url: 'https://example.com/webhook', event: 'news.created', active: true },
    { id: 2, url: 'https://example.com/user-webhook', event: 'user.registered', active: false },
  ]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'news.created' });

  const regenerateKey = () => {
    const newKey = 'ec_live_sk_' + Math.random().toString(36).substring(2, 18);
    setApiKey(newKey);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert(t.keyCopied);
  };

  const addWebhook = () => {
    if (newWebhook.url) {
      setWebhooks([...webhooks, { id: Date.now(), url: newWebhook.url, event: newWebhook.event, active: true }]);
      setNewWebhook({ url: '', event: 'news.created' });
    }
  };

  const toggleWebhook = (id: number) => {
    setWebhooks(webhooks.map((w) => (w.id === id ? { ...w, active: !w.active } : w)));
  };

  const deleteWebhook = (id: number) => {
    setWebhooks(webhooks.filter((w) => w.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t.savedMsg);
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSubmit}>
        <div className="settings-header">
          <div className="settings-title-group">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <button type="submit" className="btn-save-settings">
            <Save className="w-4 h-4" /> {t.save}
          </button>
        </div>

        <div className="settings-layout-stack">
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Key /> {t.panelApiKey}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="form-field-group">
                <label>{t.labelApiKey}</label>
                <div className="api-key-wrapper">
                  <input type="text" value={apiKey} readOnly className="form-input-text api-key-input" />
                  <button type="button" onClick={copyKey} className="btn-icon" title={t.titleCopy}>
                    <Copy className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={regenerateKey} className="btn-icon danger" title={t.titleRegen}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>{t.apiKeyNote}</p>
              </div>
              <div className="alert-box warning">
                ⚠️ <strong>{t.alertWarning}</strong> {t.alertText}
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Code /> {t.panelDocs}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="code-snippet-box">
                <p className="code-snippet-comment">{t.commentList}</p>
                <p><span className="code-snippet-method">GET</span> <span className="code-snippet-url">{supabaseUrl}/v1/news</span></p>
                <p className="code-snippet-comment">{t.commentHeaders}</p>
                <p>Authorization: Bearer {apiKey}</p>
              </div>
              <div className="code-snippet-box">
                <p className="code-snippet-comment">{t.commentCreate}</p>
                <p><span className="code-snippet-method">POST</span> <span className="code-snippet-url">{supabaseUrl}/v1/news</span></p>
                <p className="code-snippet-comment">{t.commentBody}</p>
                <p>{`{"title": "Nova Notícia", "content": "..."}`}</p>
              </div>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: '13px', color: 'var(--settings-primary)', fontWeight: 600 }}>
                {t.viewDocs}
              </a>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Webhook /> {t.panelWebhooks}</h2>
            </div>
            <div className="settings-panel-body">
              <p style={{ fontSize: '13px', color: '#50575e', marginBottom: '16px' }}>{t.webhooksDesc}</p>
              <div className="webhook-inline-form">
                <div className="grid-col-1-3">
                  <div style={{ gridColumn: 'span 2' }}>
                    <input
                      type="url"
                      placeholder={t.placeholderUrl}
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      className="form-input-text"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={newWebhook.event}
                      onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })}
                      className="form-select"
                      style={{ flex: 1 }}
                    >
                      <option value="news.created">{t.eventNewsCreated}</option>
                      <option value="news.updated">{t.eventNewsUpdated}</option>
                      <option value="user.registered">{t.eventUserRegistered}</option>
                      <option value="user.login">{t.eventUserLogin}</option>
                    </select>
                    <button type="button" onClick={addWebhook} className="btn-save-settings" style={{ padding: '0 16px' }}>
                      {t.add}
                    </button>
                  </div>
                </div>
              </div>
              <div className="webhook-list">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="webhook-item">
                    <div className="webhook-item-info">
                      <p className="webhook-url">{webhook.url}</p>
                      <p className="webhook-event">{webhook.event}</p>
                    </div>
                    <div className="webhook-actions">
                      <label className="ios-toggle-switch">
                        <input type="checkbox" checked={webhook.active} onChange={() => toggleWebhook(webhook.id)} />
                        <span className="ios-toggle-slider"></span>
                      </label>
                      <button type="button" onClick={() => deleteWebhook(webhook.id)} className="btn-icon danger" style={{ width: '32px', height: '32px' }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2>{t.panelRateLimits}</h2>
            </div>
            <div className="settings-panel-body">
              <div className="rate-limits-grid">
                <div className="rate-limit-card">
                  <div className="rate-limit-card-val">1000</div>
                  <div className="rate-limit-card-desc">{t.reqPerHour}</div>
                </div>
                <div className="rate-limit-card">
                  <div className="rate-limit-card-val">100</div>
                  <div className="rate-limit-card-desc">{t.uploadsPerHour}</div>
                </div>
                <div className="rate-limit-card">
                  <div className="rate-limit-card-val">10MB</div>
                  <div className="rate-limit-card-desc">{t.maxSize}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
