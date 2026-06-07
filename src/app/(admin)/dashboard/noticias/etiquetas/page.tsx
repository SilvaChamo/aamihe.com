'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import '../noticias.css';

const copy = {
  pt: {
    title: 'Etiquetas',
    addBtn: 'Adicionar Etiqueta',
    colName: 'Nome',
    colDesc: 'Descrição',
    colSlug: 'Slug',
    colCount: 'Contagem',
    colActions: 'Ações',
    empty: 'Nenhuma etiqueta encontrada',
    createFirst: 'Criar Primeira Etiqueta',
  },
  fr: {
    title: 'Étiquettes',
    addBtn: 'Ajouter une étiquette',
    colName: 'Nom',
    colDesc: 'Description',
    colSlug: 'Slug',
    colCount: 'Nombre',
    colActions: 'Actions',
    empty: 'Aucune étiquette trouvée',
    createFirst: 'Créer la première étiquette',
  },
  en: {
    title: 'Tags',
    addBtn: 'Add Tag',
    colName: 'Name',
    colDesc: 'Description',
    colSlug: 'Slug',
    colCount: 'Count',
    colActions: 'Actions',
    empty: 'No tags found',
    createFirst: 'Create First Tag',
  },
} as const;

export default function EtiquetasPage() {
  const { locale } = useLanguage();
  const t = copy[locale];

  return (
    <div className="noticias-page">
      <div className="noticias-header">
        <h1 className="noticias-title">{t.title}</h1>
        <button type="button" className="noticias-button primary">
          <Plus className="noticias-button-icon" />
          {t.addBtn}
        </button>
      </div>

      <div className="noticias-table">
        <table className="noticias-table-element">
          <thead>
            <tr>
              <th>{t.colName}</th>
              <th>{t.colDesc}</th>
              <th>{t.colSlug}</th>
              <th>{t.colCount}</th>
              <th>{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="noticias-table-empty">
              <td colSpan={5}>
                <div className="noticias-empty">
                  <p className="noticias-empty-text">{t.empty}</p>
                  <button type="button" className="noticias-button primary">
                    <Plus className="noticias-button-icon" />
                    {t.createFirst}
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
