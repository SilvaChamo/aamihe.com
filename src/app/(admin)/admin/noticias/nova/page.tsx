'use client';

import React from 'react';
import { Save, Eye, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import '../noticias.css';

export default function NovaNoticiaPage() {
  return (
    <div className="noticias-page">
      <div className="noticias-header">
        <h1 className="noticias-title">Adicionar Nova Notícia</h1>
        <div className="noticias-actions">
          <button className="noticias-button secondary">
            <Eye className="noticias-button-icon" />
            Pré-visualizar
          </button>
          <button className="noticias-button primary">
            <Save className="noticias-button-icon" />
            Publicar
          </button>
        </div>
      </div>

      <div className="noticias-form-grid">
        <div className="noticias-form-main">
          <div className="noticias-form-group">
            <label className="noticias-label">Título</label>
            <input 
              type="text" 
              placeholder="Título da notícia" 
              className="noticias-input"
            />
          </div>

          <div className="noticias-form-group">
            <label className="noticias-label">Conteúdo</label>
            <div className="noticias-editor">
              <div className="noticias-editor-toolbar">
                <button className="noticias-editor-button">B</button>
                <button className="noticias-editor-button">I</button>
                <button className="noticias-editor-button">U</button>
                <button className="noticias-editor-button">H1</button>
                <button className="noticias-editor-button">H2</button>
                <button className="noticias-editor-button">
                  <LinkIcon className="noticias-editor-icon" />
                </button>
                <button className="noticias-editor-button">
                  <ImageIcon className="noticias-editor-icon" />
                </button>
              </div>
              <textarea 
                placeholder="Escreva o conteúdo da notícia..." 
                className="noticias-textarea"
                rows={15}
              />
            </div>
          </div>

          <div className="noticias-form-group">
            <label className="noticias-label">Imagem de Destaque</label>
            <div className="noticias-image-upload">
              <Upload className="noticias-upload-icon" />
              <p className="noticias-upload-text">Arraste e solte ou clique para carregar</p>
              <button className="noticias-button secondary">
                Selecionar Imagem
              </button>
            </div>
          </div>
        </div>

        <div className="noticias-form-sidebar">
          <div className="noticias-sidebar-section">
            <h3 className="noticias-sidebar-title">Publicar</h3>
            <div className="noticias-sidebar-field">
              <label className="noticias-label">Estado</label>
              <select className="noticias-select">
                <option>Rascunho</option>
                <option>Publicar</option>
                <option>Pendente</option>
              </select>
            </div>
            <div className="noticias-sidebar-field">
              <label className="noticias-label">Data de Publicação</label>
              <input 
                type="datetime-local" 
                className="noticias-input"
              />
            </div>
            <div className="noticias-sidebar-actions">
              <button className="noticias-button secondary full-width">
                Guardar Rascunho
              </button>
              <button className="noticias-button primary full-width">
                Publicar
              </button>
            </div>
          </div>

          <div className="noticias-sidebar-section">
            <h3 className="noticias-sidebar-title">Categorias</h3>
            <div className="noticias-sidebar-field">
              <select className="noticias-select">
                <option>Selecione uma categoria</option>
                <option>Eventos</option>
                <option>Conferências</option>
                <option>Notícias</option>
                <option>Artigos</option>
              </select>
            </div>
            <button className="noticias-button secondary full-width">
              + Adicionar Nova Categoria
            </button>
          </div>

          <div className="noticias-sidebar-section">
            <h3 className="noticias-sidebar-title">Etiquetas</h3>
            <div className="noticias-tags-input">
              <input 
                type="text" 
                placeholder="Adicionar etiqueta..." 
                className="noticias-input"
              />
            </div>
            <button className="noticias-button secondary full-width">
              + Adicionar Nova Etiqueta
            </button>
          </div>

          <div className="noticias-sidebar-section">
            <h3 className="noticias-sidebar-title">SEO</h3>
            <div className="noticias-sidebar-field">
              <label className="noticias-label">Título SEO</label>
              <input 
                type="text" 
                placeholder="Título para motores de busca" 
                className="noticias-input"
              />
            </div>
            <div className="noticias-sidebar-field">
              <label className="noticias-label">Descrição SEO</label>
              <textarea 
                placeholder="Descrição para motores de busca" 
                className="noticias-textarea"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
