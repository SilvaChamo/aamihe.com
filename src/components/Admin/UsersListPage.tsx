'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminBase } from '@/lib/admin-base';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import { adminFetch } from '@/lib/admin-auth';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useSessionUser } from '@/hooks/useSessionUser';
import { getGravatarUrl } from '@/lib/gravatar';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { useLanguage } from '@/context/LanguageContext';
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

const copy = {
  pt: {
    title: 'Utilizadores',
    addUser: 'Adicionar utilizador',
    bulkActions: 'Ações por lotes',
    actionDelete: 'Eliminar',
    actionReset: 'Enviar reposição de palavra-passe',
    apply: 'Aplicar',
    changeRole: 'Mudar papel para…',
    change: 'Alterar',
    searchPlaceholder: 'Pesquisar utilizadores',
    searchBtn: 'Pesquisar utilizadores',
    colUsername: 'Nome de utilizador',
    colName: 'Nome',
    colAlcunha: 'Alcunha',
    colEmail: 'E-mail',
    colRole: 'Papel',
    colArticles: 'Artigos',
    selectAll: 'Selecionar todos',
    selectUser: (u: string) => `Selecionar ${u}`,
    editLink: 'Editar',
    viewLink: 'Ver',
    deleting: 'A eliminar…',
    deleteBtn: 'Eliminar',
    resetPassword: 'Enviar reposição de senha',
    empty: 'Nenhum utilizador encontrado.',
    items: (n: number) => `${n} ${n === 1 ? 'item' : 'itens'}`,
    confirmDelete: (u: string) => `Tem a certeza que deseja eliminar o utilizador "${u}"? Esta ação não pode ser revertida.`,
    confirmReset: (e: string) => `Enviar email de reposição de senha para "${e}"?`,
    errDelete: 'Erro ao eliminar utilizador: ',
    errLoad: 'Erro ao carregar utilizadores:',
  },
  fr: {
    title: 'Utilisateurs',
    addUser: 'Ajouter un utilisateur',
    bulkActions: 'Actions groupées',
    actionDelete: 'Supprimer',
    actionReset: 'Envoyer une réinitialisation de mot de passe',
    apply: 'Appliquer',
    changeRole: 'Changer le rôle en…',
    change: 'Modifier',
    searchPlaceholder: 'Rechercher des utilisateurs',
    searchBtn: 'Rechercher des utilisateurs',
    colUsername: "Nom d'utilisateur",
    colName: 'Nom',
    colAlcunha: 'Surnom',
    colEmail: 'E-mail',
    colRole: 'Rôle',
    colArticles: 'Articles',
    selectAll: 'Sélectionner tout',
    selectUser: (u: string) => `Sélectionner ${u}`,
    editLink: 'Modifier',
    viewLink: 'Voir',
    deleting: 'Suppression…',
    deleteBtn: 'Supprimer',
    resetPassword: 'Envoyer une réinitialisation de mot de passe',
    empty: 'Aucun utilisateur trouvé.',
    items: (n: number) => `${n} élément${n !== 1 ? 's' : ''}`,
    confirmDelete: (u: string) => `Êtes-vous sûr de vouloir supprimer l'utilisateur "${u}" ? Cette action est irréversible.`,
    confirmReset: (e: string) => `Envoyer un e-mail de réinitialisation de mot de passe à "${e}" ?`,
    errDelete: "Erreur lors de la suppression de l'utilisateur : ",
    errLoad: 'Erreur lors du chargement des utilisateurs :',
  },
  en: {
    title: 'Users',
    addUser: 'Add user',
    bulkActions: 'Bulk actions',
    actionDelete: 'Delete',
    actionReset: 'Send password reset',
    apply: 'Apply',
    changeRole: 'Change role to…',
    change: 'Change',
    searchPlaceholder: 'Search users',
    searchBtn: 'Search users',
    colUsername: 'Username',
    colName: 'Name',
    colAlcunha: 'Nickname',
    colEmail: 'E-mail',
    colRole: 'Role',
    colArticles: 'Articles',
    selectAll: 'Select all',
    selectUser: (u: string) => `Select ${u}`,
    editLink: 'Edit',
    viewLink: 'View',
    deleting: 'Deleting…',
    deleteBtn: 'Delete',
    resetPassword: 'Send password reset',
    empty: 'No users found.',
    items: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
    confirmDelete: (u: string) => `Are you sure you want to delete user "${u}"? This action cannot be undone.`,
    confirmReset: (e: string) => `Send password reset email to "${e}"?`,
    errDelete: 'Error deleting user: ',
    errLoad: 'Error loading users:',
  },
} as const;

const ROLES = ['Administrador', 'Editor', 'Actor', 'Contribuidor'];

export default function UsersListPage() {
  const base = useAdminBase();
  const router = useRouter();
  const { locale } = useLanguage();
  const t = copy[locale];
  const { loading: sessionLoading } = useSessionUser();
  const { canManageUsers } = useAdminPermissions();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/users/list?scope=staff', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) {
        router.replace('/dashboard/login');
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: unknown) {
      console.error(t.errLoad, err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, [router, t.errLoad]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!canManageUsers) {
      setLoading(false);
      return;
    }
    loadUsers();
  }, [sessionLoading, canManageUsers, loadUsers]);

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return user.username.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
  });

  const handleDelete = async (user: UserItem) => {
    if (!confirm(t.confirmDelete(user.username))) return;
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
      alert(t.errDelete + (err instanceof Error ? err.message : 'Erro'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    if (!confirm(t.confirmReset(user.email))) return;
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
        <h1>{t.title}</h1>
        <Link href={`${base}/utilizadores/novo`} className="wp-btn wp-btn-outline">
          {t.addUser}
        </Link>
      </div>

      <div className="wp-list-toolbar">
        <div className="wp-list-toolbar-left">
          <select className="wp-select" defaultValue="" aria-label={t.bulkActions}>
            <option value="">{t.bulkActions}</option>
            <option value="delete">{t.actionDelete}</option>
            <option value="reset">{t.actionReset}</option>
          </select>
          <button type="button" className="wp-btn">
            {t.apply}
          </button>
          <select className="wp-select" defaultValue="" aria-label={t.changeRole}>
            <option value="">{t.changeRole}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="button" className="wp-btn">
            {t.change}
          </button>
        </div>
        <div className="wp-list-toolbar-right">
          <div className="wp-search-group">
            <input
              type="search"
              className="wp-input"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" className="wp-btn">
              {t.searchBtn}
            </button>
          </div>
        </div>
      </div>

      <div className="wp-list-table-wrap">
        <table className="wp-list-table">
          <thead>
            <tr>
              <th className="check-column">
                <input type="checkbox" aria-label={t.selectAll} />
              </th>
              <th>{t.colUsername}</th>
              <th>{t.colName}</th>
              <th>{t.colAlcunha}</th>
              <th>{t.colEmail}</th>
              <th>{t.colRole}</th>
              <th style={{ textAlign: 'center' }}>{t.colArticles}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="wp-empty">
                  {t.empty}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="check-column">
                    <input type="checkbox" aria-label={t.selectUser(user.username)} />
                  </td>
                  <td className="username-cell">
                    <div className="wp-user-cell">
                      <img
                        src={resolveAvatarUrl(user.avatar) || getGravatarUrl(user.email, 80)}
                        alt=""
                        className="wp-avatar"
                      />
                      <div>
                        <Link href={`${base}/utilizadores/editar/${user.id}`} className="wp-username-link">
                          {user.username}
                        </Link>
                        <div className="wp-row-actions">
                          <Link href={`${base}/utilizadores/editar/${user.id}`}>{t.editLink}</Link>
                          <span className="sep">|</span>
                          <Link href={`${base}/utilizadores/ver/${user.id}`}>{t.viewLink}</Link>
                          {!user.isAdmin && (
                            <>
                              <span className="sep">|</span>
                              <button
                                type="button"
                                className="delete"
                                disabled={deletingId === user.id}
                                onClick={() => handleDelete(user)}
                              >
                                {deletingId === user.id ? t.deleting : t.deleteBtn}
                              </button>
                            </>
                          )}
                          <span className="sep">|</span>
                          <button type="button" onClick={() => handleResetPassword(user)}>
                            {t.resetPassword}
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
        <p className="wp-list-footer">{t.items(filteredUsers.length)}</p>
      )}
    </div>
  );
}
