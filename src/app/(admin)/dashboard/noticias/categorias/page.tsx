'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useNews } from '@/context/NewsContext';
import { slugifyCategory } from '@/data/news-categories';
import { useLanguage } from '@/context/LanguageContext';
import '../noticias.css';

type ViewMode = 'list' | 'add' | 'edit';

interface CategoryFormState {
  name: string;
  description: string;
  slug: string;
  etiqueta: string;
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
  slug: '',
  etiqueta: '',
};

const copy = {
  pt: {
    titleList: 'Categorias',
    titleAdd: 'Adicionar categoria',
    titleEdit: 'Editar categoria',
    addBtn: 'Adicionar Categoria',
    backBtn: 'Voltar à lista',
    colName: 'Nome',
    colDesc: 'Descrição',
    colSlug: 'Slug',
    colCount: 'Contagem',
    colActions: 'Ações',
    empty: 'Nenhuma categoria encontrada',
    createFirst: 'Criar Primeira Categoria',
    labelName: 'Nome',
    placeholderName: 'Nome da categoria',
    labelSlug: 'Slug',
    placeholderSlug: 'slug-da-categoria',
    labelTag: 'Etiqueta',
    placeholderTag: 'Etiqueta da categoria',
    labelDesc: 'Descrição',
    placeholderDesc: 'Descrição da categoria',
    cancel: 'Cancelar',
    saveAdd: 'Adicionar categoria',
    saveEdit: 'Guardar alterações',
    deleteConfirm: (n: string) => `Tem a certeza que deseja eliminar a categoria "${n}"?`,
    editAria: (n: string) => `Editar ${n}`,
    deleteAria: (n: string) => `Eliminar ${n}`,
  },
  fr: {
    titleList: 'Catégories',
    titleAdd: 'Ajouter une catégorie',
    titleEdit: 'Modifier la catégorie',
    addBtn: 'Ajouter une catégorie',
    backBtn: 'Retour à la liste',
    colName: 'Nom',
    colDesc: 'Description',
    colSlug: 'Slug',
    colCount: 'Nombre',
    colActions: 'Actions',
    empty: 'Aucune catégorie trouvée',
    createFirst: 'Créer la première catégorie',
    labelName: 'Nom',
    placeholderName: 'Nom de la catégorie',
    labelSlug: 'Slug',
    placeholderSlug: 'slug-de-la-categorie',
    labelTag: 'Étiquette',
    placeholderTag: 'Étiquette de la catégorie',
    labelDesc: 'Description',
    placeholderDesc: 'Description de la catégorie',
    cancel: 'Annuler',
    saveAdd: 'Ajouter la catégorie',
    saveEdit: 'Enregistrer les modifications',
    deleteConfirm: (n: string) => `Êtes-vous sûr de vouloir supprimer la catégorie "${n}" ?`,
    editAria: (n: string) => `Modifier ${n}`,
    deleteAria: (n: string) => `Supprimer ${n}`,
  },
  en: {
    titleList: 'Categories',
    titleAdd: 'Add category',
    titleEdit: 'Edit category',
    addBtn: 'Add Category',
    backBtn: 'Back to list',
    colName: 'Name',
    colDesc: 'Description',
    colSlug: 'Slug',
    colCount: 'Count',
    colActions: 'Actions',
    empty: 'No categories found',
    createFirst: 'Create First Category',
    labelName: 'Name',
    placeholderName: 'Category name',
    labelSlug: 'Slug',
    placeholderSlug: 'category-slug',
    labelTag: 'Tag',
    placeholderTag: 'Category tag',
    labelDesc: 'Description',
    placeholderDesc: 'Category description',
    cancel: 'Cancel',
    saveAdd: 'Add category',
    saveEdit: 'Save changes',
    deleteConfirm: (n: string) => `Are you sure you want to delete the category "${n}"?`,
    editAria: (n: string) => `Edit ${n}`,
    deleteAria: (n: string) => `Delete ${n}`,
  },
} as const;

export default function CategoriasPage() {
  const { news, categories, addCategory, updateCategory, deleteCategory } = useNews();
  const { locale } = useLanguage();
  const t = copy[locale];
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const getCategoryCount = (name: string) =>
    news.filter((item) => item.category === name).length;

  const openAddForm = () => {
    setViewMode('add');
    setEditingSlug(null);
    setFormData(emptyForm);
    setError(null);
  };

  const openEditForm = (slug: string) => {
    const category = categories.find((item) => item.slug === slug);
    if (!category) return;
    setViewMode('edit');
    setEditingSlug(slug);
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      etiqueta: category.etiqueta || '',
    });
    setError(null);
  };

  const closeForm = () => {
    setViewMode('list');
    setEditingSlug(null);
    setFormData(emptyForm);
    setError(null);
  };

  useEffect(() => {
    if (viewMode !== 'add') return;
    setFormData((prev) => ({ ...prev, slug: slugifyCategory(prev.name) }));
  }, [formData.name, viewMode]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (viewMode === 'add') {
      const result = addCategory(formData);
      if (result) { setError(result); return; }
      closeForm();
      return;
    }
    if (viewMode === 'edit' && editingSlug) {
      const result = updateCategory(editingSlug, formData);
      if (result) { setError(result); return; }
      closeForm();
    }
  };

  const handleDelete = (slug: string, name: string) => {
    if (!window.confirm(t.deleteConfirm(name))) return;
    const result = deleteCategory(slug);
    if (result) alert(result);
  };

  const pageTitle =
    viewMode === 'add' ? t.titleAdd : viewMode === 'edit' ? t.titleEdit : t.titleList;

  return (
    <div className="noticias-page">
      <div className="noticias-header">
        <h1 className="noticias-title">{pageTitle}</h1>
        {viewMode === 'list' ? (
          <button type="button" className="noticias-button primary" onClick={openAddForm}>
            <Plus className="noticias-button-icon" />
            {t.addBtn}
          </button>
        ) : (
          <button type="button" className="noticias-button secondary" onClick={closeForm}>
            <X className="noticias-button-icon" />
            {t.backBtn}
          </button>
        )}
      </div>

      <div className="categorias-table-container">
        {viewMode === 'list' ? (
          <table className="noticias-table-element">
            <thead>
              <tr>
                <th>{t.colName}</th>
                <th>{t.colDesc}</th>
                <th>{t.colSlug}</th>
                <th>{t.colCount}</th>
                <th className="categorias-col-actions">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr className="noticias-table-empty">
                  <td colSpan={5}>
                    <div className="noticias-empty">
                      <p className="noticias-empty-text">{t.empty}</p>
                      <button type="button" className="noticias-button primary" onClick={openAddForm}>
                        <Plus className="noticias-button-icon" />
                        {t.createFirst}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.slug}>
                    <td><strong>{category.name}</strong></td>
                    <td>{category.description?.trim() ? category.description : '—'}</td>
                    <td>{category.slug}</td>
                    <td>{getCategoryCount(category.name)}</td>
                    <td className="categorias-col-actions">
                      <div className="td-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          aria-label={t.editAria(category.name)}
                          onClick={() => openEditForm(category.slug)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          aria-label={t.deleteAria(category.name)}
                          onClick={() => handleDelete(category.slug, category.name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <form className="admin-form categorias-inline-form" onSubmit={handleSubmit}>
            {error && <p className="categorias-form-error">{error}</p>}
            <div className="categorias-form-row">
              <div className="form-group">
                <label htmlFor="category-name">{t.labelName}</label>
                <input
                  id="category-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder={t.placeholderName}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category-slug">{t.labelSlug}</label>
                <input
                  id="category-slug"
                  type="text"
                  value={formData.slug}
                  onChange={(event) =>
                    setFormData({ ...formData, slug: slugifyCategory(event.target.value) })
                  }
                  placeholder={t.placeholderSlug}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category-etiqueta">{t.labelTag}</label>
                <input
                  id="category-etiqueta"
                  type="text"
                  value={formData.etiqueta}
                  onChange={(event) => setFormData({ ...formData, etiqueta: event.target.value })}
                  placeholder={t.placeholderTag}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="category-description">{t.labelDesc}</label>
              <textarea
                id="category-description"
                className="categorias-description-field"
                rows={5}
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder={t.placeholderDesc}
              />
            </div>
            <div className="categorias-form-actions">
              <button type="button" className="noticias-button secondary" onClick={closeForm}>
                {t.cancel}
              </button>
              <button type="submit" className="noticias-button primary">
                {viewMode === 'add' ? t.saveAdd : t.saveEdit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
