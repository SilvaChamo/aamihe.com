'use client';

import Link from 'next/link';
import { Mail, Globe, Edit2, Loader2 } from 'lucide-react';
import { useSessionUser } from '@/hooks/useSessionUser';
import { displayNameTypeLabel, resolveUserDisplayName } from '@/lib/user-types';
import { getGravatarUrl } from '@/lib/gravatar';
import './admin-wp.css';

function displayName(user: {
  firstName?: string;
  lastName?: string;
  username: string;
  alcunha?: string;
  displayNameType?: string;
}) {
  return resolveUserDisplayName(user);
}

export default function SubscriberAccountPage() {
  const { user, loading } = useSessionUser();

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
        <p className="wp-notice wp-notice-error">Não foi possível carregar a sua conta.</p>
      </div>
    );
  }

  const fullName = displayName(user);

  return (
    <div className="wp-admin-page wp-profile-page">
      <div className="wp-page-header">
        <div>
          <h1>
            Perfil: <strong>{user.username}</strong>
          </h1>
          <p className="wp-subtitle">Minha conta &rsaquo; Ver perfil</p>
        </div>
        <Link href="/dashboard/definicoes-conta" className="wp-btn wp-btn-primary">
          <Edit2 size={14} aria-hidden /> Editar conta
        </Link>
      </div>

      <div className="wp-profile-card">
        <div className="wp-profile-header">
          {user.avatar ? (
            <img src={user.avatar} className="wp-profile-avatar" alt="" />
          ) : (
            <img src={getGravatarUrl(user.email, 150)} className="wp-profile-avatar" alt="" />
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
              <th>Nome público</th>
              <td>{displayNameTypeLabel(user.displayNameType)}</td>
            </tr>
            <tr>
              <th>Telefone</th>
              <td>{user.telefone || '—'}</td>
            </tr>
            <tr>
              <th>Profissão</th>
              <td>{user.profissao || '—'}</td>
            </tr>
            {user.website ? (
              <tr>
                <th>Website</th>
                <td>
                  <a href={user.website} target="_blank" rel="noreferrer" className="wp-link-inline">
                    <Globe size={14} aria-hidden /> {user.website}
                  </a>
                </td>
              </tr>
            ) : null}
            <tr>
              <th>Papel</th>
              <td>{user.role}</td>
            </tr>
            {user.bio ? (
              <tr>
                <th>Biografia</th>
                <td>{user.bio}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="wp-profile-actions">
        <Link href="/dashboard/definicoes-conta" className="wp-btn wp-btn-primary">
          Editar conta
        </Link>
      </div>
    </div>
  );
}
