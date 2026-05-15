'use client';

import React from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import './noticias.css';

export default function NoticiasPage() {
  return (
    <div className="noticias-page">
      <div className="noticias-header">
        <h1 className="noticias-title">Todas as Notícias</h1>
        <button className="noticias-button primary">
          <Plus className="noticias-button-icon" />
          Adicionar Nova
        </button>
      </div>

      <div className="noticias-search-bar">
        <Search className="noticias-search-icon" />
        <input 
          type="text" 
          placeholder="Pesquisar notícias..." 
          className="noticias-search-input"
        />
        <button className="noticias-button secondary">
          <Filter className="noticias-button-icon" />
          Filtrar
        </button>
      </div>

      <div className="noticias-tabs">
        <button className="noticias-tab active">Todas</button>
        <button className="noticias-tab">Publicadas</button>
        <button className="noticias-tab">Rascunhos</button>
        <button className="noticias-tab">Pendentes</button>
      </div>

      <div className="noticias-table">
        <table className="noticias-table-element">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Categoria</th>
              <th>Data</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="noticias-table-empty">
              <td colSpan={6}>
                <div className="noticias-empty">
                  <p className="noticias-empty-text">Nenhuma notícia encontrada</p>
                  <button className="noticias-button primary">
                    <Plus className="noticias-button-icon" />
                    Criar Primeira Notícia
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
