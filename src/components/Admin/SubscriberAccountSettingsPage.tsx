'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import { useSessionUser } from '@/hooks/useSessionUser';
import './admin-wp.css';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  telefone: string;
  profissao: string;
  bio: string;
  website: string;
};

export default function SubscriberAccountSettingsPage() {
  const { user, loading: sessionLoading } = useSessionUser();
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    telefone: '',
    profissao: '',
    bio: '',
    website: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      telefone: user.telefone || '',
      profissao: user.profissao || '',
      bio: user.bio || '',
      website: user.website || '',
    });
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword && !currentPassword) {
      setError('Indique a senha actual para definir uma nova senha.');
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          telefone: form.telefone,
          profissao: form.profissao,
          bio: form.bio,
          website: form.website,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível guardar as alterações.');
        return;
      }
      setSuccess('Alterações guardadas com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="wp-admin-page">
        <p className="wp-muted">A carregar…</p>
      </div>
    );
  }

  return (
    <div className="wp-admin-page wp-form-wrap">
      <div className="wp-page-header wp-form-page-header">
        <h1>Definições da conta</h1>
        <p className="wp-subtitle">
          <Link href="/dashboard/minha-conta">Minha conta</Link> &rsaquo; Definições
        </p>
        <div className="wp-form-header-divider" aria-hidden="true" />
      </div>

      {error ? <div className="wp-notice-error">{error}</div> : null}
      {success ? <div className="wp-notice-success">{success}</div> : null}

      <form onSubmit={handleSubmit}>
        <table className="wp-form-table">
          <tbody>
            <tr className="section-row">
              <th colSpan={2}>
                <h2>Informação pessoal</h2>
              </th>
            </tr>
            <tr>
              <th scope="row">Nome próprio</th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Apelido</th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </td>
            </tr>
            <tr>
              <th scope="row">E-mail (obrigatório)</th>
              <td>
                <input
                  type="email"
                  className="wp-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Telefone</th>
              <td>
                <input
                  type="tel"
                  className="wp-input"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="+258 84 123 4567"
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Profissão</th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.profissao}
                  onChange={(e) => setForm({ ...form, profissao: e.target.value })}
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Website</th>
              <td>
                <input
                  type="url"
                  className="wp-input"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Biografia</th>
              <td>
                <textarea
                  className="wp-input"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                />
              </td>
            </tr>

            <tr className="section-row">
              <th colSpan={2}>
                <h2>Palavra-passe</h2>
              </th>
            </tr>
            <tr>
              <th scope="row">Senha actual</th>
              <td>
                <div className="wp-password-field">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="wp-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="wp-password-toggle"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Nova senha</th>
              <td>
                <div className="wp-password-field">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="wp-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="wp-password-toggle"
                    onClick={() => setShowNewPassword((v) => !v)}
                    aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Confirmar nova senha</th>
              <td>
                <div className="wp-password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="wp-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="wp-password-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="submit">
          <button type="submit" className="wp-btn wp-btn-primary" disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar alterações'}
          </button>
          <Link href="/dashboard/minha-conta" className="wp-btn" style={{ marginLeft: 8 }}>
            Cancelar
          </Link>
        </p>
      </form>
    </div>
  );
}
