'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminBase } from '@/lib/admin-base';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import { adminFetch } from '@/lib/admin-auth';
import { getGravatarUrl } from '@/lib/gravatar';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import './admin-wp.css';

interface UserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  articles: number;
  avatar?: string | null;
  isAdmin?: boolean;
  alcunha?: string;
}

const ROLES = ['Administrador', 'Editor', 'Actor', 'Contribuidor'];

export default function UsersListPage() {
  const base = useAdminBase();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/users/list?scope=staff', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar utilizadores:', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (user: UserItem) => {
    if (
      !confirm(
        `Tem a certeza que deseja eliminar o utilizador "${user.username}"? Esta ação não pode ser revertida.`
      )
    )
      return;
    setDeletingId(user.id);
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: unknown) {
      alert('Erro ao eliminar utilizador: ' + (err instanceof Error ? err.message : 'Erro'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    if (!confirm(`Enviar email de reposição de senha para "${user.email}"?`)) return;
    try {
      const res = await adminFetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || 'Email enviado.');
    } catch (err: unknown) {
      alert('Erro: ' + (err instanceof Error ? err.message : 'Erro'));
    }
  };

  return (
    <div className="wp-admin-page">
      <div className="wp-page-header wp-page-header--users-title">
        <h1>Utilizadores</h1>
        <Link href={`${base}/utilizadores/novo`} className="wp-btn wp-btn-outline">
          Adicionar utilizador
        </Link>
      </div>

      <div className="wp-list-toolbar">
        <div className="wp-list-toolbar-left">
          <select className="wp-select" defaultValue="" aria-label="Ações por lotes">
            <option value="">Ações por lotes</option>
            <option value="delete">Eliminar</option>
            <option value="reset">Enviar reposição de palavra-passe</option>
          </select>
          <button type="button" className="wp-btn">
            Aplicar
          </button>
          <select className="wp-select" defaultValue="" aria-label="Mudar papel">
            <option value="">Mudar papel para…</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="button" className="wp-btn">
            Alterar
          </button>
        </div>
        <div className="wp-list-toolbar-right">
          <div className="wp-search-group">
            <input
              type="search"
              className="wp-input"
              placeholder="Pesquisar utilizadores"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" className="wp-btn">
              Pesquisar utilizadores
            </button>
          </div>
        </div>
      </div>

      <div className="wp-list-table-wrap">
        <table className="wp-list-table">
          <thead>
            <tr>
              <th className="check-column">
                <input type="checkbox" aria-label="Selecionar todos" />
              </th>
              <th>Nome de utilizador</th>
              <th>Nome</th>
              <th>Alcunha</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th style={{ textAlign: 'center' }}>Artigos</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={7} />
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="wp-empty">
                  Nenhum utilizador encontrado.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="check-column">
                    <input type="checkbox" aria-label={`Selecionar ${user.username}`} />
                  </td>
                  <td className="username-cell">
                    <div className="wp-user-cell">
                      <img
                        src={resolveAvatarUrl(user.avatar) || getGravatarUrl(user.email, 80)}
                        alt=""
                        className="wp-avatar"
                      />
                      <div>
                        <Link
                          href={`${base}/utilizadores/editar/${user.id}`}
                          className="wp-username-link"
                        >
                          {user.username}
                        </Link>
                        <div className="wp-row-actions">
                          <Link href={`${base}/utilizadores/editar/${user.id}`}>Editar</Link>
                          <span className="sep">|</span>
                          <Link href={`${base}/utilizadores/ver/${user.id}`}>Ver</Link>
                          {!user.isAdmin && (
                            <>
                              <span className="sep">|</span>
                              <button
                                type="button"
                                className="delete"
                                disabled={deletingId === user.id}
                                onClick={() => handleDelete(user)}
                              >
                                {deletingId === user.id ? 'A eliminar…' : 'Eliminar'}
                              </button>
                            </>
                          )}
                          <span className="sep">|</span>
                          <button type="button" onClick={() => handleResetPassword(user)}>
                            Enviar reposição de senha
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{user.name || '—'}</td>
                  <td>{user.alcunha || '—'}</td>
                  <td>
                    <a href={`mailto:${user.email}`}>{user.email}</a>
                  </td>
                  <td>{user.role}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Link href={`${base}/noticias?autor=${user.username}`}>{user.articles}</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <p className="wp-list-footer">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'item' : 'itens'}
        </p>
      )}
    </div>
  );
}
