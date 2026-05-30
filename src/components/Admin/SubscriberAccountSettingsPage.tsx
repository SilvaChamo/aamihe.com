'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { adminFetch } from '@/lib/admin-auth';
import { compressAvatarImage } from '@/lib/compress-image';
import { getGravatarUrl } from '@/lib/gravatar';
import { useSessionUser } from '@/hooks/useSessionUser';
import type { UserProfile } from '@/lib/user-types';
import './admin-wp.css';

type FormState = {
  username: string;
  firstName: string;
  lastName: string;
  alcunha: string;
  displayNameType: string;
  email: string;
  telefone: string;
  profissao: string;
  bio: string;
  website: string;
};

function profileToForm(user: UserProfile): FormState {
  return {
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    alcunha: user.alcunha || '',
    displayNameType: user.displayNameType || 'full_name',
    email: user.email || '',
    telefone: user.telefone || '',
    profissao: user.profissao || '',
    bio: user.bio || '',
    website: user.website || '',
  };
}

export default function SubscriberAccountSettingsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSessionUser();
  const [form, setForm] = useState<FormState | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (user) {
      setForm(profileToForm(user));
      setAvatarPreview(user.avatar);
      setAvatarFile(null);
      setRemoveAvatar(false);
    }
  }, [user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setRemoveAvatar(false);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const defaultAvatar = user ? getGravatarUrl(form?.email || user.email, 150) : '';
  const displayAvatar = removeAvatar ? defaultAvatar : avatarPreview || defaultAvatar;
  const hasCustomAvatar = Boolean(!removeAvatar && (avatarPreview || user?.avatar));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
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
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const compressedBlob = await compressAvatarImage(avatarFile);
        const compressedFile = new File([compressedBlob], avatarFile.name, { type: 'image/jpeg' });
        const uploadData = new FormData();
        uploadData.append('file', compressedFile);
        uploadData.append('bucket', 'avatars');
        const uploadRes = await adminFetch('/api/admin/upload', { method: 'POST', body: uploadData });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadJson.error || 'Erro ao carregar a miniatura.');
          return;
        }
        avatarUrl = uploadJson.url;
      } else if (removeAvatar) {
        avatarUrl = '';
      }

      const res = await adminFetch('/api/admin/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          alcunha: form.alcunha,
          displayNameType: form.displayNameType,
          email: form.email,
          telefone: form.telefone,
          profissao: form.profissao,
          bio: form.bio,
          website: form.website,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível guardar as alterações.');
        return;
      }
      router.push('/dashboard/minha-conta');
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading || !form) {
    return (
      <div className="wp-admin-page">
        <div className="wp-loading-center">
          <Loader2 className="wp-spin" size={28} aria-hidden />
          <p>A carregar dados da conta…</p>
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

      <form key={user.id} onSubmit={handleSubmit}>
        <table className="wp-form-table">
          <tbody>
            <tr className="section-row">
              <th colSpan={2}>
                <h2>Informação pessoal</h2>
              </th>
            </tr>
            <tr>
              <th scope="row">Miniatura</th>
              <td>
                <div className="wp-avatar-upload">
                  <img src={displayAvatar} alt="" className="wp-avatar-lg" />
                  <div className="wp-avatar-upload-btns">
                    <button
                      type="button"
                      className="wp-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={14} />
                      {hasCustomAvatar ? 'Trocar miniatura' : 'Editar miniatura'}
                    </button>
                    {hasCustomAvatar ? (
                      <button
                        type="button"
                        className="wp-btn wp-btn-danger"
                        onClick={handleRemoveAvatar}
                      >
                        <Trash2 size={14} />
                        Remover
                      </button>
                    ) : null}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Nome de utilizador</th>
              <td>
                <input type="text" className="wp-input" value={form.username} readOnly disabled />
              </td>
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
              <th scope="row">Alcunha</th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.alcunha}
                  onChange={(e) => setForm({ ...form, alcunha: e.target.value })}
                />
                <p className="description">Opcional. Se preenchida, pode ser usada como nome público.</p>
              </td>
            </tr>
            <tr>
              <th scope="row">Exibir o nome publicamente como</th>
              <td>
                <select
                  className="wp-select"
                  value={form.displayNameType}
                  onChange={(e) => setForm({ ...form, displayNameType: e.target.value })}
                >
                  <option value="first_name">{form.firstName || 'Nome próprio'}</option>
                  <option value="last_name">{form.lastName || 'Apelido'}</option>
                  <option value="full_name">
                    {`${form.firstName} ${form.lastName}`.trim() || 'Nome e apelido'}
                  </option>
                  <option value="alcunha">{form.alcunha || 'Alcunha'}</option>
                </select>
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
