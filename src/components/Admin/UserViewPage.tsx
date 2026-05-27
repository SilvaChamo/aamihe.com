'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Globe, FileText, Edit2, Loader2 } from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import './admin-wp.css';

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  alcunha?: string;
  telefone?: string;
  profissao?: string;
  cargo?: string;
  website?: string;
  bio?: string;
  articles?: number;
  avatar?: string | null;
  isAdmin?: boolean;
}

export default function UserViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const base = useAdminBase();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/get/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (!cancelled) setUser(data.user);
      } catch (err: unknown) {
        console.error('Erro ao carregar utilizador:', err instanceof Error ? err.message : err);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="wp-admin-page">
        <div className="wp-loading-center">
          <Loader2 className="wp-spin" size={28} aria-hidden />
          <p>A carregar perfil…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wp-admin-page">
        <p className="wp-notice wp-notice-error">Utilizador não encontrado.</p>
        <Link href={`${base}/utilizadores`} className="wp-btn wp-btn-link">
          ← Voltar aos Utilizadores
        </Link>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="wp-admin-page wp-profile-page">
      <div className="wp-page-header">
        <div>
          <h1>
            Perfil: <strong>{user.username}</strong>
          </h1>
          <p className="wp-subtitle">
            <Link href={`${base}/utilizadores`}>Utilizadores</Link>
            {' '}&rsaquo; Ver perfil
          </p>
        </div>
        <Link href={`${base}/utilizadores/editar/${user.id}`} className="wp-btn wp-btn-primary">
          <Edit2 size={14} aria-hidden /> Editar utilizador
        </Link>
      </div>

      <div className="wp-profile-card">
        <div className="wp-profile-header">
          {user.avatar ? (
            <img src={user.avatar} className="wp-profile-avatar" alt="" />
          ) : user.isAdmin ? (
            <div className="wp-profile-avatar wp-profile-avatar--admin">
              <span>
                <span className="wp-ah-green">AH</span>
              </span>
            </div>
          ) : (
            <img
              src="https://secure.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?s=150&d=mm&r=g"
              className="wp-profile-avatar"
              alt=""
            />
          )}
          <div>
            <h2>{fullName}</h2>
            <p className="wp-muted">@{user.username}</p>
            <span className="wp-role-badge">{user.role}</span>
          </div>
        </div>

        <table className="wp-profile-table">
          <tbody>
            <tr>
              <th>Nome</th>
              <td>{fullName}</td>
            </tr>
            <tr>
              <th>Nome de utilizador</th>
              <td>{user.username}</td>
            </tr>
            <tr>
              <th>E-mail</th>
              <td>
                <a href={`mailto:${user.email}`} className="wp-link-inline">
                  <Mail size={14} aria-hidden /> {user.email}
                </a>
              </td>
            </tr>
            <tr>
              <th>Alcunha</th>
              <td>{user.alcunha || '—'}</td>
            </tr>
            <tr>
              <th>Telefone</th>
              <td>{user.telefone || '—'}</td>
            </tr>
            <tr>
              <th>Profissão</th>
              <td>{user.profissao || '—'}</td>
            </tr>
            <tr>
              <th>Cargo</th>
              <td>{user.cargo || '—'}</td>
            </tr>
            {user.website && (
              <tr>
                <th>Website</th>
                <td>
                  <a href={user.website} target="_blank" rel="noreferrer" className="wp-link-inline">
                    <Globe size={14} aria-hidden /> {user.website}
                  </a>
                </td>
              </tr>
            )}
            <tr>
              <th>Papel</th>
              <td>{user.role}</td>
            </tr>
            {user.bio && (
              <tr>
                <th>Biografia</th>
                <td>{user.bio}</td>
              </tr>
            )}
            <tr>
              <th>Artigos publicados</th>
              <td>
                <Link href={`${base}/noticias?autor=${user.username}`} className="wp-link-inline">
                  <FileText size={14} aria-hidden /> {user.articles ?? 0} artigos
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="wp-profile-actions">
        <Link href={`${base}/utilizadores/editar/${user.id}`} className="wp-btn wp-btn-primary">
          Editar utilizador
        </Link>
        {!user.isAdmin && (
          <button type="button" className="wp-btn wp-btn-danger-outline" disabled title="Em breve">
            Eliminar utilizador
          </button>
        )}
      </div>
    </div>
  );
}
