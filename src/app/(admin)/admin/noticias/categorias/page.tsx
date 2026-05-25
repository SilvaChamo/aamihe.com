'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useNews } from '@/context/NewsContext';
import { slugifyCategory } from '@/data/news-categories';
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

export default function CategoriasPage() {
  const { news, categories, addCategory, updateCategory, deleteCategory } = useNews();
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
    setFormData((prev) => ({
      ...prev,
      slug: slugifyCategory(prev.name),
    }));
  }, [formData.name, viewMode]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (viewMode === 'add') {
      const result = addCategory(formData);
      if (result) {
        setError(result);
        return;
      }
      closeForm();
      return;
    }

    if (viewMode === 'edit' && editingSlug) {
      const result = updateCategory(editingSlug, formData);
      if (result) {
        setError(result);
        return;
      }
      closeForm();
    }
  };

  const handleDelete = (slug: string, name: string) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar a categoria "${name}"?`)) {
      return;
    }

    const result = deleteCategory(slug);
    if (result) {
      alert(result);
    }
  };

  return (
    <div className="noticias-page">
      <div className="noticias-header">
        <h1 className="noticias-title">
          {viewMode === 'add'
            ? 'Adicionar categoria'
            : viewMode === 'edit'
              ? 'Editar categoria'
              : 'Categorias'}
        </h1>
        {viewMode === 'list' ? (
          <button type="button" className="noticias-button primary" onClick={openAddForm}>
            <Plus className="noticias-button-icon" />
            Adicionar Categoria
          </button>
        ) : (
          <button type="button" className="noticias-button secondary" onClick={closeForm}>
            <X className="noticias-button-icon" />
            Voltar à lista
          </button>
        )}
      </div>

      <div className="categorias-table-container">
        {viewMode === 'list' ? (
          <table className="noticias-table-element">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Slug</th>
                <th>Contagem</th>
                <th className="categorias-col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr className="noticias-table-empty">
                  <td colSpan={5}>
                    <div className="noticias-empty">
                      <p className="noticias-empty-text">Nenhuma categoria encontrada</p>
                      <button type="button" className="noticias-button primary" onClick={openAddForm}>
                        <Plus className="noticias-button-icon" />
                        Criar Primeira Categoria
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.slug}>
                    <td>
                      <strong>{category.name}</strong>
                    </td>
                    <td>{category.description?.trim() ? category.description : '—'}</td>
                    <td>{category.slug}</td>
                    <td>{getCategoryCount(category.name)}</td>
                    <td className="categorias-col-actions">
                      <div className="td-actions">
                        <button
                          type="button"
                          className="action-btn edit"
                          aria-label={`Editar ${category.name}`}
                          onClick={() => openEditForm(category.slug)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className="action-btn delete"
                          aria-label={`Eliminar ${category.name}`}
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
                <label htmlFor="category-name">Nome</label>
                <input
                  id="category-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Nome da categoria"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-slug">Slug</label>
                <input
                  id="category-slug"
                  type="text"
                  value={formData.slug}
                  onChange={(event) =>
                    setFormData({ ...formData, slug: slugifyCategory(event.target.value) })
                  }
                  placeholder="slug-da-categoria"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-etiqueta">Etiqueta</label>
                <input
                  id="category-etiqueta"
                  type="text"
                  value={formData.etiqueta}
                  onChange={(event) => setFormData({ ...formData, etiqueta: event.target.value })}
                  placeholder="Etiqueta da categoria"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category-description">Descrição</label>
              <textarea
                id="category-description"
                className="categorias-description-field"
                rows={5}
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Descrição da categoria"
              />
            </div>

            <div className="categorias-form-actions">
              <button type="button" className="noticias-button secondary" onClick={closeForm}>
                Cancelar
              </button>
              <button type="submit" className="noticias-button primary">
                {viewMode === 'add' ? 'Adicionar categoria' : 'Guardar alterações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
