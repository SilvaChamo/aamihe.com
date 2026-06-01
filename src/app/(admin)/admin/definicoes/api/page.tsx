'use client';

import React, { useState } from 'react';
import { Code, Save, Key, Webhook, Copy, RefreshCw, Trash2 } from 'lucide-react';
import '../definicoes.css';

export default function DefinicoesAPIPage() {
  const [apiKey, setApiKey] = useState('ec_live_sk_1234567890abcdef');
  const [webhooks, setWebhooks] = useState([
    { id: 1, url: 'https://example.com/webhook', event: 'news.created', active: true },
    { id: 2, url: 'https://example.com/user-webhook', event: 'user.registered', active: false }
  ]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'news.created' });

  const regenerateKey = () => {
    const newKey = 'ec_live_sk_' + Math.random().toString(36).substring(2, 18);
    setApiKey(newKey);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API Key copiada!');
  };

  const addWebhook = () => {
    if (newWebhook.url) {
      setWebhooks([...webhooks, { 
        id: Date.now(), 
        url: newWebhook.url, 
        event: newWebhook.event, 
        active: true 
      }]);
      setNewWebhook({ url: '', event: 'news.created' });
    }
  };

  const toggleWebhook = (id: number) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const deleteWebhook = (id: number) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Definições de API guardadas com sucesso!');
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSubmit}>
        <div className="settings-header">
          <div className="settings-title-group">
            <h1>API & Integrações</h1>
            <p>Configure chaves de API e webhooks</p>
          </div>
          <button type="submit" className="btn-save-settings">
            <Save className="w-4 h-4" /> Guardar
          </button>
        </div>

        <div className="settings-layout-stack">
          {/* API Key */}
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Key /> Chave de API</h2>
            </div>
            
            <div className="settings-panel-body">
              <div className="form-field-group">
                <label>API Key (Live)</label>
                <div className="api-key-wrapper">
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="form-input-text api-key-input"
                  />
                  <button 
                    type="button"
                    onClick={copyKey}
                    className="btn-icon"
                    title="Copiar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={regenerateKey}
                    className="btn-icon danger"
                    title="Regenerar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#50575e', marginTop: '4px' }}>
                  Use esta chave para autenticar as suas requisições à API
                </p>
              </div>

              <div className="alert-box warning">
                ⚠️ <strong>Atenção:</strong> Mantenha a sua API Key segura. Não a partilhe em código client-side ou repositórios públicos.
              </div>
            </div>
          </div>

          {/* API Documentation */}
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Code /> Documentação da API</h2>
            </div>
            
            <div className="settings-panel-body">
              <div className="code-snippet-box">
                <p className="code-snippet-comment">// Exemplo: Listar notícias</p>
                <p><span className="code-snippet-method">GET</span> <span className="code-snippet-url">https://supabase.aamihe.com/v1/news</span></p>
                <p className="code-snippet-comment">Headers:</p>
                <p>Authorization: Bearer {apiKey}</p>
              </div>

              <div className="code-snippet-box">
                <p className="code-snippet-comment">// Exemplo: Criar notícia</p>
                <p><span className="code-snippet-method">POST</span> <span className="code-snippet-url">https://supabase.aamihe.com/v1/news</span></p>
                <p className="code-snippet-comment">Body:</p>
                <p>{`{"title": "Nova Notícia", "content": "..."}`}</p>
              </div>

              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                style={{ fontSize: '13px', color: 'var(--settings-primary)', fontWeight: 600 }}
              >
                Ver documentação completa →
              </a>
            </div>
          </div>

          {/* Webhooks */}
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2><Webhook /> Webhooks</h2>
            </div>
            
            <div className="settings-panel-body">
              <p style={{ fontSize: '13px', color: '#50575e', marginBottom: '16px' }}>
                Receba notificações em tempo real quando eventos ocorrerem no sistema.
              </p>

              {/* Add Webhook */}
              <div className="webhook-inline-form">
                <div className="grid-col-1-3">
                  <div style={{ gridColumn: 'span 2' }}>
                    <input
                      type="url"
                      placeholder="URL do webhook"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                      className="form-input-text"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={newWebhook.event}
                      onChange={(e) => setNewWebhook({...newWebhook, event: e.target.value})}
                      className="form-select"
                      style={{ flex: 1 }}
                    >
                      <option value="news.created">Notícia criada</option>
                      <option value="news.updated">Notícia atualizada</option>
                      <option value="user.registered">Utilizador registado</option>
                      <option value="user.login">Login</option>
                    </select>
                    <button 
                      type="button"
                      onClick={addWebhook}
                      className="btn-save-settings"
                      style={{ padding: '0 16px' }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook List */}
              <div className="webhook-list">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="webhook-item">
                    <div className="webhook-item-info">
                      <p className="webhook-url">{webhook.url}</p>
                      <p className="webhook-event">{webhook.event}</p>
                    </div>
                    <div className="webhook-actions">
                      <label className="ios-toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={webhook.active}
                          onChange={() => toggleWebhook(webhook.id)}
                        />
                        <span className="ios-toggle-slider"></span>
                      </label>
                      <button 
                        type="button"
                        onClick={() => deleteWebhook(webhook.id)}
                        className="btn-icon danger"
                        style={{ width: '32px', height: '32px' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rate Limits */}
          <div className="settings-panel">
            <div className="settings-panel-header">
              <h2>Limites de Requisições</h2>
            </div>
            
            <div className="settings-panel-body">
              <div className="rate-limits-grid">
                <div className="rate-limit-card">
                  <div className="rate-limit-card-val">1000</div>
                  <div className="rate-limit-card-desc">Requisições/hora</div>
                </div>
                <div className="rate-limit-card">
                  <div className="rate-limit-card-val">100</div>
                  <div className="rate-limit-card-desc">Uploads/hora</div>
                </div>
                <div className="rate-limit-card">
                  <div className="rate-limit-card-val">10MB</div>
                  <div className="rate-limit-card-desc">Tamanho máximo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
