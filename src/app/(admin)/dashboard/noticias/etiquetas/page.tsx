'use client';

import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import '../noticias.css';

export default function EtiquetasPage() {
  return (
    <div className="noticias-page">
      <div className="noticias-header">
        <h1 className="noticias-title">Etiquetas</h1>
        <button className="noticias-button primary">
          <Plus className="noticias-button-icon" />
          Adicionar Etiqueta
        </button>
      </div>

      <div className="noticias-table">
        <table className="noticias-table-element">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Slug</th>
              <th>Contagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="noticias-table-empty">
              <td colSpan={5}>
                <div className="noticias-empty">
                  <p className="noticias-empty-text">Nenhuma etiqueta encontrada</p>
                  <button className="noticias-button primary">
                    <Plus className="noticias-button-icon" />
                    Criar Primeira Etiqueta
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
