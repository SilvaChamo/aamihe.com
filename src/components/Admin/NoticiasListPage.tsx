'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNews } from '@/context/NewsContext';
import type { NewsItem } from '@/data/news';
import { useAdminBase } from '@/lib/admin-base';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import { PanelPageHeaderSkeleton } from '@/components/Admin/PanelSkeleton';
import '@/app/(admin)/admin/noticias/admin-noticias.css';

export default function NoticiasListPage() {
  const base = useAdminBase();
  const { canManageNews, loading: permsLoading } = useAdminPermissions();
  const { news, deleteNews, updateNews, categories, loading } = useNews();
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
    if (window.confirm(`Tem a certeza que deseja mover "${title}" para o lixo?`)) {
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
          <h1 className="admin-news-title">Notícias</h1>
          {canManageNews ? (
            <Link href={`${base}/noticias/nova`} className="btn-add-new">
              Adicionar nova
            </Link>
          ) : null}
        </div>
        <div className="admin-news-search">
          <input
            type="text"
            placeholder="Pesquisar notícias..."
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
              <option>Ações em massa</option>
              <option>Editar</option>
              <option>Mover para o lixo</option>
            </select>
            <button type="button" className="btn-apply">
              Aplicar
            </button>
            <select className="wp-select">
              <option>Todas as datas</option>
            </select>
            <select className="wp-select">
              <option>Todas as categorias</option>
              {categories.map((cat) => (
                <option key={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn-apply">
              Filtrar
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
                    aria-label="Selecionar todas as notícias visíveis"
                  />
                </th>
              ) : null}
              <th className="col-title">Título</th>
              <th className="col-cat">Categoria</th>
              <th className="col-date">Data</th>
              <th className="col-status">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.length === 0 ? (
              <tr>
                <td colSpan={colSpan} style={{ padding: '20px', textAlign: 'center' }}>
                  Nenhuma notícia encontrada.
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
                          aria-label={`Selecionar ${item.title}`}
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
                                <Link href={`${base}/noticias/editar/${item.id}`}>Editar</Link> |
                              </span>
                              <span className="action-inline-edit">
                                <button type="button" onClick={() => handleQuickEdit(item)}>
                                  Edição rápida
                                </button>{' '}
                                |
                              </span>
                              <span className="trash">
                                <button
                                  type="button"
                                  className="submitdelete"
                                  onClick={() => handleDelete(item.id, item.title)}
                                >
                                  Lixo
                                </button>{' '}
                                |
                              </span>
                              <span className="view">
                                <a href={`/noticias/${item.id}`} target="_blank" rel="noreferrer">
                                  Ver
                                </a>
                              </span>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <span className="view">
                                <a href={`/noticias/${item.id}`} target="_blank" rel="noreferrer">
                                  Ver no site
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
                      <span style={{ fontSize: '11px', color: '#8c8f94' }}>Publicada</span>
                    </td>
                    <td className="col-status">
                      {item.status === 'draft' ? 'Rascunho' : 'Publicado'}
                    </td>
                  </tr>

                  {!readOnly && quickEditId === item.id && editForm ? (
                    <tr className="quick-edit-row">
                      <td colSpan={colSpan}>
                        <div className="quick-edit-container">
                          <span className="quick-edit-title">Edição Rápida</span>
                          <div className="quick-edit-footer">
                            <button type="button" className="btn-cancel" onClick={() => setQuickEditId(null)}>
                              Cancelar
                            </button>
                            <button type="button" className="btn-save" onClick={saveQuickEdit}>
                              Atualizar
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
        {filteredNews.length} itens
      </div>
    </div>
  );
}
