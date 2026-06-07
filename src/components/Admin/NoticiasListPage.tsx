'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNews } from '@/context/NewsContext';
import type { NewsItem } from '@/data/news';
import { useAdminBase } from '@/lib/admin-base';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import { PanelPageHeaderSkeleton } from '@/components/Admin/PanelSkeleton';
import { useLanguage } from '@/context/LanguageContext';
import '@/app/(admin)/admin/noticias/admin-noticias.css';

const copy = {
  pt: {
    title: 'Notícias',
    addNew: 'Adicionar nova',
    searchPlaceholder: 'Pesquisar notícias...',
    bulkActions: 'Ações em massa',
    edit: 'Editar',
    moveToTrash: 'Mover para o lixo',
    apply: 'Aplicar',
    allDates: 'Todas as datas',
    allCategories: 'Todas as categorias',
    filter: 'Filtrar',
    colTitle: 'Título',
    colCategory: 'Categoria',
    colDate: 'Data',
    colStatus: 'Estado',
    selectAll: 'Selecionar todas as notícias visíveis',
    selectItem: (t: string) => `Selecionar ${t}`,
    editLink: 'Editar',
    quickEdit: 'Edição rápida',
    trash: 'Lixo',
    view: 'Ver',
    viewSite: 'Ver no site',
    published: 'Publicada',
    draft: 'Rascunho',
    statusPublished: 'Publicado',
    none: 'Nenhuma notícia encontrada.',
    items: (n: number) => `${n} itens`,
    deleteConfirm: (t: string) => `Tem a certeza que deseja mover "${t}" para o lixo?`,
    quickEditTitle: 'Edição Rápida',
    cancel: 'Cancelar',
    update: 'Atualizar',
  },
  fr: {
    title: 'Actualités',
    addNew: 'Ajouter',
    searchPlaceholder: 'Rechercher des actualités...',
    bulkActions: 'Actions groupées',
    edit: 'Modifier',
    moveToTrash: 'Mettre à la corbeille',
    apply: 'Appliquer',
    allDates: 'Toutes les dates',
    allCategories: 'Toutes les catégories',
    filter: 'Filtrer',
    colTitle: 'Titre',
    colCategory: 'Catégorie',
    colDate: 'Date',
    colStatus: 'État',
    selectAll: 'Sélectionner toutes les actualités visibles',
    selectItem: (t: string) => `Sélectionner ${t}`,
    editLink: 'Modifier',
    quickEdit: 'Modification rapide',
    trash: 'Corbeille',
    view: 'Voir',
    viewSite: 'Voir sur le site',
    published: 'Publié',
    draft: 'Brouillon',
    statusPublished: 'Publié',
    none: 'Aucune actualité trouvée.',
    items: (n: number) => `${n} éléments`,
    deleteConfirm: (t: string) => `Êtes-vous sûr de vouloir mettre "${t}" à la corbeille ?`,
    quickEditTitle: 'Modification rapide',
    cancel: 'Annuler',
    update: 'Mettre à jour',
  },
  en: {
    title: 'News',
    addNew: 'Add new',
    searchPlaceholder: 'Search news...',
    bulkActions: 'Bulk actions',
    edit: 'Edit',
    moveToTrash: 'Move to trash',
    apply: 'Apply',
    allDates: 'All dates',
    allCategories: 'All categories',
    filter: 'Filter',
    colTitle: 'Title',
    colCategory: 'Category',
    colDate: 'Date',
    colStatus: 'Status',
    selectAll: 'Select all visible news',
    selectItem: (t: string) => `Select ${t}`,
    editLink: 'Edit',
    quickEdit: 'Quick edit',
    trash: 'Trash',
    view: 'View',
    viewSite: 'View on site',
    published: 'Published',
    draft: 'Draft',
    statusPublished: 'Published',
    none: 'No news found.',
    items: (n: number) => `${n} items`,
    deleteConfirm: (t: string) => `Are you sure you want to move "${t}" to the trash?`,
    quickEditTitle: 'Quick Edit',
    cancel: 'Cancel',
    update: 'Update',
  },
} as const;

export default function NoticiasListPage() {
  const base = useAdminBase();
  const { canManageNews, loading: permsLoading } = useAdminPermissions();
  const { news, deleteNews, updateNews, categories, loading } = useNews();
  const { locale } = useLanguage();
  const t = copy[locale];
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<NewsItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const readOnly = !canManageNews;

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const allFilteredSelected =
    filteredNews.length > 0 && filteredNews.every((item) => selectedIds.has(item.id));
  const someFilteredSelected =
    filteredNews.some((item) => selectedIds.has(item.id)) && !allFilteredSelected;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredNews.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredNews.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleQuickEdit = (item: (typeof news)[0]) => {
    setQuickEditId(item.id);
    setEditForm({ ...item });
  };

  const saveQuickEdit = () => {
    if (editForm) {
      updateNews(editForm.id, editForm);
      setQuickEditId(null);
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(t.deleteConfirm(title))) {
      deleteNews(id);
    }
  };

  const colSpan = readOnly ? 4 : 5;
  const isPageLoading = loading || permsLoading;

  if (isPageLoading) {
    return (
      <div className="admin-news-container">
        <PanelPageHeaderSkeleton withAction={canManageNews} />
        <div className="wp-table-container">
          <table className="wp-table">
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={colSpan} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-news-container">
      <div className="admin-news-header">
        <div className="admin-news-title-group">
          <h1 className="admin-news-title">{t.title}</h1>
          {canManageNews ? (
            <Link href={`${base}/noticias/nova`} className="btn-add-new">
              {t.addNew}
            </Link>
          ) : null}
        </div>
        <div className="admin-news-search">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            className="wp-input"
            style={{ width: '200px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {canManageNews ? (
        <div className="admin-news-toolbar">
          <div className="admin-news-filters">
            <select className="wp-select">
              <option>{t.bulkActions}</option>
              <option>{t.edit}</option>
              <option>{t.moveToTrash}</option>
            </select>
            <button type="button" className="btn-apply">
              {t.apply}
            </button>
            <select className="wp-select">
              <option>{t.allDates}</option>
            </select>
            <select className="wp-select">
              <option>{t.allCategories}</option>
              {categories.map((cat) => (
                <option key={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <button type="button" className="btn-apply">
              {t.filter}
            </button>
          </div>
        </div>
      ) : null}

      <div className="wp-table-container">
        <table className="wp-table">
          <thead>
            <tr>
              {!readOnly ? (
                <th className="col-cb">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label={t.selectAll}
                  />
                </th>
              ) : null}
              <th className="col-title">{t.colTitle}</th>
              <th className="col-cat">{t.colCategory}</th>
              <th className="col-date">{t.colDate}</th>
              <th className="col-status">{t.colStatus}</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.length === 0 ? (
              <tr>
                <td colSpan={colSpan} style={{ padding: '20px', textAlign: 'center' }}>
                  {t.none}
                </td>
              </tr>
            ) : (
              filteredNews.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className={`news-row ${quickEditId === item.id ? 'quick-edit-row' : ''}`}>
                    {!readOnly ? (
                      <td className="col-cb">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={t.selectItem(item.title)}
                        />
                      </td>
                    ) : null}
                    <td className="col-title">
                      <div className="title-with-thumb">
                        <img src={item.image} alt="" className="news-thumb" />
                        <div>
                          <Link href={`/noticias/${item.id}`} className="news-row-title">
                            {item.title}
                          </Link>
                          {!readOnly ? (
                            <div className="row-actions">
                              <span className="edit">
                                <Link href={`${base}/noticias/editar/${item.id}`}>{t.editLink}</Link> |
                              </span>
                              <span className="action-inline-edit">
                                <button type="button" onClick={() => handleQuickEdit(item)}>
                                  {t.quickEdit}
                                </button>{' '}
                                |
                              </span>
                              <span className="trash">
                                <button
                                  type="button"
                                  className="submitdelete"
                                  onClick={() => handleDelete(item.id, item.title)}
                                >
                                  {t.trash}
                                </button>{' '}
                                |
                              </span>
                              <span className="view">
                                <a href={`/noticias/${item.id}`} target="_blank" rel="noreferrer">
                                  {t.view}
                                </a>
                              </span>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <span className="view">
                                <a href={`/noticias/${item.id}`} target="_blank" rel="noreferrer">
                                  {t.viewSite}
                                </a>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="col-cat">{item.category}</td>
                    <td className="col-date">
                      {item.date}
                      <br />
                      <span style={{ fontSize: '11px', color: '#8c8f94' }}>{t.published}</span>
                    </td>
                    <td className="col-status">
                      {item.status === 'draft' ? t.draft : t.statusPublished}
                    </td>
                  </tr>

                  {!readOnly && quickEditId === item.id && editForm ? (
                    <tr className="quick-edit-row">
                      <td colSpan={colSpan}>
                        <div className="quick-edit-container">
                          <span className="quick-edit-title">{t.quickEditTitle}</span>
                          <div className="quick-edit-footer">
                            <button type="button" className="btn-cancel" onClick={() => setQuickEditId(null)}>
                              {t.cancel}
                            </button>
                            <button type="button" className="btn-save" onClick={saveQuickEdit}>
                              {t.update}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '10px', fontSize: '13px', color: '#50575e' }}>
        {t.items(filteredNews.length)}
      </div>
    </div>
  );
}
