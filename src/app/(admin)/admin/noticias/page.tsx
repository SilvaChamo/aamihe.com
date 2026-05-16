'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useNews } from '@/context/NewsContext';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import './admin-noticias.css';

const CATEGORIES = ['Institucional', 'Educação', 'Desenvolvimento', 'Eventos'];

export default function NoticiasPage() {
  const { news, deleteNews, updateNews } = useNews();
  const [quickEditId, setQuickEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickEdit = (item: any) => {
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

  return (
    <div className="admin-news-container">
      <div className="admin-news-header">
        <div className="admin-news-title-group">
          <h1 className="admin-news-title">Notícias</h1>
          <Link href="/admin/noticias/nova" className="btn-add-new">
            Adicionar nova
          </Link>
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

      <div className="admin-news-toolbar">
        <div className="admin-news-filters">
          <select className="wp-select">
            <option>Ações em massa</option>
            <option>Editar</option>
            <option>Mover para o lixo</option>
          </select>
          <button className="btn-apply">Aplicar</button>
          
          <select className="wp-select">
            <option>Todas as datas</option>
            <option>Setembro 2024</option>
            <option>Agosto 2024</option>
          </select>

          <select className="wp-select">
            <option>Todas as categorias</option>
            {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
          </select>
          <button className="btn-apply">Filtrar</button>
        </div>
      </div>

      <div className="wp-table-container">
        <table className="wp-table">
          <thead>
            <tr>
              <th className="col-cb"><input type="checkbox" /></th>
              <th className="col-title">Título</th>
              <th className="col-cat">Categoria</th>
              <th className="col-date">Data</th>
              <th className="col-status">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredNews.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Nenhuma notícia encontrada.</td></tr>
            ) : (
              filteredNews.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className={`news-row ${quickEditId === item.id ? 'quick-edit-row' : ''}`}>
                    <td className="col-cb"><input type="checkbox" /></td>
                    <td className="col-title">
                      <div className="title-with-thumb">
                        <img src={item.image} alt="" className="news-thumb" />
                        <div>
                          <Link href={`/admin/noticias/editar/${item.id}`} className="news-row-title">
                            {item.title}
                          </Link>
                          <div className="row-actions">
                            <span className="action-edit">
                              <Link href={`/admin/noticias/editar/${item.id}`}>Editar</Link> | 
                            </span>
                            <span className="action-inline-edit">
                              <button onClick={() => handleQuickEdit(item)}>Edição rápida</button> | 
                            </span>
                            <span className="action-trash">
                              <button onClick={() => handleDelete(item.id, item.title)}>Lixo</button> | 
                            </span>
                            <span className="action-view">
                              <Link href={`/noticias/${item.id}`} target="_blank">Ver</Link>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="col-cat">{item.category}</td>
                    <td className="col-date">
                      {item.date}<br />
                      <span style={{ fontSize: '11px', color: '#8c8f94' }}>Publicada</span>
                    </td>
                    <td className="col-status">
                      {item.status === 'draft' ? 'Rascunho' : 'Publicado'}
                    </td>
                  </tr>

                  {quickEditId === item.id && (
                    <tr className="quick-edit-row">
                      <td colSpan={5}>
                        <div className="quick-edit-container">
                          <span className="quick-edit-title">Edição Rápida</span>
                          <div className="quick-edit-grid">
                            <div className="field-column">
                              <div className="field-group">
                                <label>Título</label>
                                <input 
                                  type="text" 
                                  className="wp-input" 
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                />
                              </div>
                              <div className="field-group">
                                <label>Data</label>
                                <input 
                                  type="text" 
                                  className="wp-input" 
                                  value={editForm.date}
                                  onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="field-column">
                              <div className="field-group">
                                <label>Categorias</label>
                                <div style={{ border: '1px solid #8c8f94', background: '#fff', padding: '5px', maxHeight: '80px', overflowY: 'auto' }}>
                                  {CATEGORIES.map(cat => (
                                    <label key={cat} style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={editForm.category === cat}
                                        onChange={() => setEditForm({...editForm, category: cat})}
                                      /> {cat}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="field-column">
                              <div className="field-group">
                                <label>Estado</label>
                                <select 
                                  className="wp-select" 
                                  style={{ width: '100%' }}
                                  value={editForm.status || 'published'}
                                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                >
                                  <option value="published">Publicado</option>
                                  <option value="draft">Rascunho</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="quick-edit-footer">
                            <button className="btn-cancel" onClick={() => setQuickEditId(null)}>Cancelar</button>
                            <button className="btn-save" onClick={saveQuickEdit}>Atualizar</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
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
