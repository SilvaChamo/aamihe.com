'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import { getGravatarUrl } from '@/lib/gravatar';
import './admin-wp.css';

const ROLES = ['Administrador', 'Editor', 'Actor', 'Subscritor', 'Contribuidor'];

type FormState = {
  username: string;
  firstName: string;
  lastName: string;
  alcunha: string;
  displayNameType: string;
  email: string;
  website: string;
  bio: string;
  telefone: string;
  profissao: string;
  cargo: string;
  role: string;
};

const emptyForm: FormState = {
  username: '',
  firstName: '',
  lastName: '',
  alcunha: '',
  displayNameType: 'full_name',
  email: '',
  website: '',
  bio: '',
  telefone: '',
  profissao: '',
  cargo: '',
  role: 'Subscritor',
};

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const finalSize = 400;
        const sourceSize = Math.min(img.width, img.height);
        let sx = (img.width - sourceSize) / 2;
        let sy = (img.height - sourceSize) / 2;
        if (img.height > img.width) sy = (img.height - sourceSize) * 0.15;
        canvas.width = finalSize;
        canvas.height = finalSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, finalSize, finalSize);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Falha na compressão'))),
          'image/jpeg',
          0.6
        );
      };
    };
    reader.onerror = reject;
  });
}

export function AddUserFormPage() {
  const base = useAdminBase();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const compressedBlob = await compressImage(avatarFile);
        const compressedFile = new File([compressedBlob], avatarFile.name, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('bucket', 'avatars');
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro ao carregar imagem');
        avatarUrl = uploadData.url;
      }
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`${base}/utilizadores?added=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
      setSaving(false);
    }
  };

  return (
    <UserFormLayout
      title="Adicionar novo utilizador"
      subtitle="Crie um novo utilizador e adicione-o a este site."
      error={error}
      saving={saving}
      cancelHref={`${base}/utilizadores`}
      submitLabel="Adicionar novo utilizador"
      onSubmit={handleSave}
      form={form}
      setForm={setForm}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPassword
      avatarPreview={avatarPreview}
      onAvatarChange={handleAvatarChange}
      onRemoveAvatar={() => {
        setAvatarPreview(null);
        setAvatarFile(null);
      }}
      fileInputRef={fileInputRef}
    />
  );
}

export function EditUserFormPage({ userId }: { userId: string }) {
  const base = useAdminBase();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/users/get/${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const u = data.user;
        setForm({
          username: u.username || '',
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          alcunha: u.alcunha || '',
          displayNameType: u.displayNameType || 'full_name',
          email: u.email || '',
          website: u.website || '',
          bio: u.bio || '',
          telefone: u.telefone || '',
          profissao: u.profissao || '',
          cargo: u.cargo || '',
          role: u.role || 'Subscritor',
        });
        if (u.avatar) setAvatarPreview(u.avatar);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password && password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const compressedBlob = await compressImage(avatarFile);
        const compressedFile = new File([compressedBlob], avatarFile.name, { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('bucket', 'avatars');
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Erro ao carregar imagem');
        avatarUrl = uploadData.url;
      }
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          ...form,
          ...(password ? { password } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setSaving(false);
      router.push(`${base}/utilizadores`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="wp-admin-page">
        <p>
          <Loader2 size={20} style={{ display: 'inline', verticalAlign: 'middle' }} /> A carregar…
        </p>
      </div>
    );
  }

  return (
    <UserFormLayout
      title={`Editar utilizador: ${form.username}`}
      subtitle={
        <>
          <Link href={`${base}/utilizadores`}>Utilizadores</Link>
        </>
      }
      error={error}
      success={success ? 'Utilizador actualizado.' : null}
      saving={saving}
      cancelHref={`${base}/utilizadores`}
      submitLabel="Actualizar utilizador"
      onSubmit={handleSave}
      form={form}
      setForm={setForm}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPassword
      passwordOptional
      avatarPreview={avatarPreview}
      onAvatarChange={handleAvatarChange}
      onRemoveAvatar={() => {
        setAvatarPreview(null);
        setAvatarFile(null);
      }}
      fileInputRef={fileInputRef}
    />
  );
}

function UserFormLayout({
  title,
  subtitle,
  error,
  success,
  saving,
  cancelHref,
  submitLabel,
  onSubmit,
  form,
  setForm,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  passwordOptional,
  avatarPreview,
  onAvatarChange,
  onRemoveAvatar,
  fileInputRef,
}: {
  title: string;
  subtitle: React.ReactNode;
  error: string | null;
  success?: string | null;
  saving: boolean;
  cancelHref: string;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword?: boolean;
  passwordOptional?: boolean;
  avatarPreview: string | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showConfirmPasswordText, setShowConfirmPasswordText] = useState(false);
  const defaultAvatar = getGravatarUrl(form.email, 150);

  return (
    <div className="wp-admin-page wp-form-wrap">
      <div className="wp-page-header wp-form-page-header">
        <h1>{title}</h1>
        <p className="wp-subtitle">{subtitle}</p>
        <div className="wp-form-header-divider" aria-hidden="true" />
      </div>

      {error && <div className="wp-notice-error">{error}</div>}
      {success && <div className="wp-notice-success">{success}</div>}

      <form onSubmit={onSubmit}>
        <table className="wp-form-table">
          <tbody>
            <tr className="section-row section-row--plain">
              <th colSpan={2}>
                <h2>Nome</h2>
              </th>
            </tr>
            <tr>
              <th scope="row">Nome de utilizador (obrigatório)</th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
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
              <th scope="row">
                Nome próprio <span style={{ color: '#d63638' }}>*</span>
              </th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </td>
            </tr>
            <tr>
              <th scope="row">
                Apelido <span style={{ color: '#d63638' }}>*</span>
              </th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
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
                <p className="description">Opcional. Se preenchida, aparecerá como o nome do autor.</p>
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
                    {`${form.firstName} ${form.lastName}`.trim() || 'Nome e Apelido'}
                  </option>
                  <option value="alcunha">{form.alcunha || 'Alcunha'}</option>
                </select>
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
                  placeholder="Ex: Jornalista, Engenheiro"
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Cargo</th>
              <td>
                <input
                  type="text"
                  className="wp-input"
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ex: Editor Chefe"
                />
              </td>
            </tr>
            <tr>
              <th scope="row">Foto de perfil</th>
              <td>
                <div className="wp-avatar-upload">
                  <img
                    src={avatarPreview || defaultAvatar}
                    alt=""
                    className="wp-avatar-lg"
                  />
                  <div className="wp-avatar-upload-btns">
                    <button
                      type="button"
                      className="wp-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={14} /> Selecionar foto
                    </button>
                    {avatarPreview && (
                      <button type="button" className="wp-btn wp-btn-danger" onClick={onRemoveAvatar}>
                        <Trash2 size={14} /> Remover
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  style={{ display: 'none' }}
                />
              </td>
            </tr>

            {showPassword && (
              <>
                <tr className="section-row">
                  <th colSpan={2}>
                    <h2>Palavra-passe</h2>
                  </th>
                </tr>
                <tr>
                  <th scope="row">
                    Palavra-passe {passwordOptional ? '(deixar em branco para manter)' : '(obrigatório)'}
                  </th>
                  <td>
                    <div className="wp-password-field">
                      <input
                        type={showPasswordText ? 'text' : 'password'}
                        className="wp-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={!passwordOptional}
                      />
                      <button
                        type="button"
                        className="wp-password-toggle"
                        onClick={() => setShowPasswordText((v) => !v)}
                        aria-label={showPasswordText ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                      >
                        {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th scope="row">
                    Confirmar palavra-passe {!passwordOptional && <span style={{ color: '#d63638' }}>*</span>}
                  </th>
                  <td>
                    <div className="wp-password-field">
                      <input
                        type={showConfirmPasswordText ? 'text' : 'password'}
                        className="wp-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!passwordOptional && !!password}
                      />
                      <button
                        type="button"
                        className="wp-password-toggle"
                        onClick={() => setShowConfirmPasswordText((v) => !v)}
                        aria-label={showConfirmPasswordText ? 'Ocultar confirmação da palavra-passe' : 'Mostrar confirmação da palavra-passe'}
                      >
                        {showConfirmPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              </>
            )}

            <tr className="section-row">
              <th colSpan={2}>
                <h2>Papel</h2>
              </th>
            </tr>
            <tr>
              <th scope="row">Papel</th>
              <td>
                <select
                  className="wp-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="wp-form-actions">
          <button type="submit" className="wp-btn wp-btn-primary" disabled={saving}>
            {saving && <Loader2 size={16} className="wp-skeleton-pulse" />}
            {submitLabel}
          </button>
          <Link href={cancelHref} className="wp-btn">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
