'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminBase } from '@/lib/admin-base';
import { adminFetch } from '@/lib/admin-auth';
import { getGravatarUrl } from '@/lib/gravatar';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { Mail } from 'lucide-react';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import './admin-wp.css';

type ConferenceDocument = {
  id: string;
  author?: string;
  email?: string;
  created_at: string;
};

type SubscriberUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  submissions: number;
  lastSubmission: string | null;
};

export default function ConferenceSubscribersPage() {
  const base = useAdminBase();
  const [subscribers, setSubscribers] = useState<SubscriberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, docsRes] = await Promise.all([
        adminFetch('/api/admin/users/list?scope=subscribers', { cache: 'no-store' }),
        adminFetch('/api/admin/documents?category=conferencia', { cache: 'no-store' }),
      ]);

      const [usersData, docsData] = await Promise.all([usersRes.json(), docsRes.json()]);
      if (!usersRes.ok) throw new Error(usersData.error || 'Erro ao carregar subscritores');

      const documents: ConferenceDocument[] = Array.isArray(docsData?.documents)
        ? docsData.documents
        : [];
      const submissionStats = new Map<string, { submissions: number; lastSubmission: string }>();

      for (const doc of documents) {
        const email = (doc.email || '').trim().toLowerCase();
        if (!email) continue;
        const existing = submissionStats.get(email);
        if (!existing) {
          submissionStats.set(email, { submissions: 1, lastSubmission: doc.created_at });
          continue;
        }
        existing.submissions += 1;
        if (new Date(doc.created_at).getTime() > new Date(existing.lastSubmission).getTime()) {
          existing.lastSubmission = doc.created_at;
        }
      }

      const users = Array.isArray(usersData?.users) ? usersData.users : [];
      const rows: SubscriberUser[] = users.map(
        (user: {
          id: string;
          username: string;
          name: string;
          email: string;
          avatar?: string | null;
        }) => {
          const emailKey = (user.email || '').trim().toLowerCase();
          const stats = submissionStats.get(emailKey);
          return {
            id: user.id,
            username: user.username,
            name: user.name || user.username,
            email: user.email,
            avatar: user.avatar ?? null,
            submissions: stats?.submissions ?? 0,
            lastSubmission: stats?.lastSubmission ?? null,
          };
        },
      );

      rows.sort((a, b) => {
        if (b.submissions !== a.submissions) return b.submissions - a.submissions;
        return a.name.localeCompare(b.name, 'pt');
      });

      setSubscribers(rows);
    } catch (err: unknown) {
      console.error('Erro ao carregar subscritores:', err instanceof Error ? err.message : err);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (sub) =>
        sub.email.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.username.toLowerCase().includes(q),
    );
  }, [subscribers, searchQuery]);

  const handleDelete = async (sub: SubscriberUser) => {
    if (
      !confirm(
        `Tem a certeza que deseja eliminar o subscritor "${sub.name}"? Esta ação não pode ser revertida.`,
      )
    ) {
      return;
    }

    setDeletingId(sub.id);
    try {
      const res = await adminFetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubscribers((prev) => prev.filter((item) => item.id !== sub.id));
    } catch (err: unknown) {
      alert('Erro ao eliminar subscritor: ' + (err instanceof Error ? err.message : 'Erro'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (sub: SubscriberUser) => {
    if (!confirm(`Enviar email de reposição de senha para "${sub.email}"?`)) return;
    try {
      const res = await adminFetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sub.email }),
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
      <div className="wp-page-header">
        <h1>Subscritores da Conferência</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <Link href={`${base}/enviar-email`} className="wp-btn wp-btn-primary">
            <Mail size={14} />
            Enviar e-mail a todos
          </Link>
          <Link href={`${base}/documentos-gerais`} className="wp-btn wp-btn-outline">
            Ver submissões
          </Link>
        </div>
      </div>

      <div className="wp-list-toolbar">
        <div className="wp-list-toolbar-right">
          <div className="wp-search-group">
            <input
              type="search"
              className="wp-input"
              placeholder="Pesquisar subscritores"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="button" className="wp-btn">
              Pesquisar subscritores
            </button>
          </div>
        </div>
      </div>

      <div className="wp-list-table-wrap">
        <table className="wp-list-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th style={{ textAlign: 'center' }}>Submissões</th>
              <th>Última submissão</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={4} />)
            ) : filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={4} className="wp-empty">
                  Sem subscritores registados por enquanto.
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div className="wp-user-cell">
                      <img
                        src={resolveAvatarUrl(sub.avatar) || getGravatarUrl(sub.email, 80)}
                        alt=""
                        className="wp-avatar"
                      />
                      <div>
                        <Link
                          href={`${base}/utilizadores/editar/${sub.id}`}
                          className="wp-username-link"
                        >
                          {sub.name}
                        </Link>
                        <div className="wp-row-actions">
                          <Link href={`${base}/utilizadores/editar/${sub.id}`}>Editar</Link>
                          <span className="sep">|</span>
                          <Link href={`${base}/utilizadores/ver/${sub.id}`}>Ver</Link>
                          <span className="sep">|</span>
                          <button
                            type="button"
                            className="delete"
                            disabled={deletingId === sub.id}
                            onClick={() => handleDelete(sub)}
                          >
                            {deletingId === sub.id ? 'A eliminar…' : 'Eliminar'}
                          </button>
                          <span className="sep">|</span>
                          <button type="button" onClick={() => handleResetPassword(sub)}>
                            Enviar reposição de senha
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Mail size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                    {sub.email}
                  </td>
                  <td style={{ textAlign: 'center' }}>{sub.submissions}</td>
                  <td>
                    {sub.lastSubmission
                      ? new Date(sub.lastSubmission).toLocaleString('pt-PT')
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <p className="wp-list-footer">
          {filteredSubscribers.length} {filteredSubscribers.length === 1 ? 'item' : 'itens'}
        </p>
      )}
    </div>
  );
}
