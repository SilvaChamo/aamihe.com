'use client';

import React from 'react';
import { Upload, X, Image as ImageIcon, Video, FileText } from 'lucide-react';
import '../media.css';

export default function AddMediaPage() {
  return (
    <div className="media-page">
      <div className="media-header">
        <h1 className="media-title">Adicionar Novo Multimédia</h1>
      </div>

      <div className="media-upload-zone">
        <div className="upload-zone">
          <Upload className="upload-icon" />
          <h3 className="upload-title">Arraste e solte ficheiros aqui</h3>
          <p className="upload-text">ou clique para selecionar</p>
          <p className="upload-formats">Formatos suportados: JPG, PNG, GIF, MP4, PDF, DOC</p>
          <button className="media-button primary">
            Selecionar Ficheiros
          </button>
        </div>
      </div>

      <div className="media-upload-options">
        <h3 className="upload-section-title">Opções de Upload</h3>
        
        <div className="upload-option">
          <label className="upload-label">Tipo de Ficheiro</label>
          <div className="upload-type-selector">
            <button className="upload-type-button active">
              <ImageIcon className="upload-type-icon" />
              Imagem
            </button>
            <button className="upload-type-button">
              <Video className="upload-type-icon" />
              Vídeo
            </button>
            <button className="upload-type-button">
              <FileText className="upload-type-icon" />
              Documento
            </button>
          </div>
        </div>

        <div className="upload-option">
          <label className="upload-label">Título</label>
          <input 
            type="text" 
            placeholder="Título do ficheiro" 
            className="upload-input"
          />
        </div>

        <div className="upload-option">
          <label className="upload-label">Descrição</label>
          <textarea 
            placeholder="Descrição do ficheiro" 
            className="upload-textarea"
            rows={4}
          />
        </div>

        <div className="upload-option">
          <label className="upload-label">Categoria</label>
          <select className="upload-select">
            <option>Selecione uma categoria</option>
            <option>Eventos</option>
            <option>Conferências</option>
            <option>Documentos Oficiais</option>
            <option>Galeria</option>
          </select>
        </div>

        <div className="upload-actions">
          <button className="media-button secondary">Cancelar</button>
          <button className="media-button primary">Fazer Upload</button>
        </div>
      </div>
    </div>
  );
}
