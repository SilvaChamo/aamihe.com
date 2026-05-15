'use client';

import React from 'react';
import { Plus, Play, Trash2, Edit2, Upload } from 'lucide-react';
import '../media.css';

export default function VideosPage() {
  return (
    <div className="media-page">
      <div className="media-header">
        <h1 className="media-title">Vídeos</h1>
        <div className="media-actions">
          <button className="media-button primary">
            <Upload className="media-button-icon" />
            Adicionar Vídeo
          </button>
        </div>
      </div>

      <div className="gallery-filters">
        <select className="upload-select">
          <option>Todos os Vídeos</option>
          <option>Conferências</option>
          <option>Eventos</option>
          <option>Tutoriais</option>
        </select>
        <select className="upload-select">
          <option>Ordenar por: Mais recentes</option>
          <option>Ordenar por: Mais antigas</option>
          <option>Ordenar por: Nome A-Z</option>
        </select>
      </div>

      <div className="videos-grid">
        <div className="gallery-placeholder">
          <Play className="media-placeholder-icon" />
          <p className="media-placeholder-text">Nenhum vídeo encontrado</p>
          <button className="media-button primary">
            <Upload className="media-button-icon" />
            Adicionar Vídeo
          </button>
        </div>
      </div>
    </div>
  );
}
