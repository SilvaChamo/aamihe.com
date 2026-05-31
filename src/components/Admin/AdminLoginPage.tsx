'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  requestPasswordReset,
  setSessionProfile,
  signInWithGoogle,
  updatePassword,
} from '@/lib/admin-auth';
import AdminLoginMathChallenge, { createLoginMathChallenge } from '@/components/Admin/AdminLoginMathChallenge';
import { verifyMathCaptcha } from '@/lib/math-captcha';
import './AdminLoginPage.css';

type AuthMode = 'login' | 'register' | 'reset' | 'new-password';

interface AdminLoginPageProps {
  redirectTo?: string;
  onSuccess?: () => void;
  initialMode?: AuthMode;
}

export default function AdminLoginPage({
  redirectTo = '/admin/noticias',
  onSuccess,
  initialMode = 'login',
}: AdminLoginPageProps) {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [registerChallenge, setRegisterChallenge] = useState(createLoginMathChallenge);
  const [registerMathAnswer, setRegisterMathAnswer] = useState('');
  const [registerLoadedAt, setRegisterLoadedAt] = useState(() => Date.now());
  const [resetChallenge, setResetChallenge] = useState(createLoginMathChallenge);
  const [resetMathAnswer, setResetMathAnswer] = useState('');
  const [resetLoadedAt, setResetLoadedAt] = useState(() => Date.now());

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setHoneypot('');
    if (nextMode !== 'login') {
      setSuccess('');
    }
    if (nextMode === 'login') {
      setResetEmail('');
    }
    if (nextMode === 'register') {
      setRegisterChallenge(createLoginMathChallenge());
      setRegisterMathAnswer('');
      setRegisterLoadedAt(Date.now());
    }
    if (nextMode === 'reset') {
      setResetChallenge(createLoginMathChallenge());
      setResetMathAnswer('');
      setResetLoadedAt(Date.now());
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: username.trim(),
          password,
          honeypot,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Não foi possível iniciar sessão.');
        return;
      }

      setSessionProfile(result.user ?? null);
      onSuccess?.();
      window.location.assign(redirectTo);
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Não foi possível iniciar sessão com Google.');
      setLoadingGoogle(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          honeypot,
          formLoadedAt: registerLoadedAt,
          mathA: registerChallenge.a,
          mathB: registerChallenge.b,
          mathAnswer: Number(registerMathAnswer),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Não foi possível concluir o registo.');
        return;
      }

      setSuccess('Conta criada com sucesso. Já pode iniciar sessão.');
      setPassword('');
      setConfirmPassword('');
      setRegisterMathAnswer('');
      setRegisterChallenge(createLoginMathChallenge());
      setError('');
      setMode('login');
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      await updatePassword(newPassword);
      setSuccess('Senha atualizada com sucesso. Já pode iniciar sessão.');
      setNewPassword('');
      setConfirmNewPassword('');
      setMode('login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a senha.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          honeypot,
          formLoadedAt: resetLoadedAt,
          mathA: resetChallenge.a,
          mathB: resetChallenge.b,
          mathAnswer: Number(resetMathAnswer),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Não foi possível processar o pedido.');
        return;
      }

      setSuccess(
        result.message ||
          'Se existir uma conta com este email, receberá em breve um link para repor a senha.',
      );
      setResetEmail('');
      setResetMathAnswer('');
      setResetChallenge(createLoginMathChallenge());
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const registerMathOk = verifyMathCaptcha(
    registerChallenge.a,
    registerChallenge.b,
    registerMathAnswer,
  );
  const resetMathOk = verifyMathCaptcha(resetChallenge.a, resetChallenge.b, resetMathAnswer);

  return (
    <div className="admin-login-page">
      <div className="admin-login-left">
        <img
          src="/images/login-bg.png"
          alt=""
          className="admin-login-bg"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="admin-login-panel">
        <div className="admin-login-panel-inner">
          <div className="admin-login-card">
            <div className="admin-login-form-box">
              <div className="admin-login-form-logo">
                <Link href="/" className="admin-login-logo" aria-label="AAMIHE">
                  <img src="/Logo-Small.png.webp" alt="" width={220} height={72} decoding="async" />
                </Link>
              </div>

              {mode === 'login' ? (
                <>
                  <form className="admin-login-form" onSubmit={handleLogin}>
                    {error ? <div className="admin-login-error">{error}</div> : null}
                    {success ? <div className="admin-login-success">{success}</div> : null}

                    <input
                      type="text"
                      name="company_url"
                      className="admin-login-honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      aria-hidden="true"
                    />

                    <input
                      type="text"
                      name="log"
                      className="input"
                      placeholder="Nome, email ou utilizador"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />

                    <div className="wp-pwd">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="pwd"
                        className="input password-input"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="wp-hide-pw"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <label className="forgetmenot">
                      <input
                        name="rememberme"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Manter sessão</span>
                    </label>

                    <button type="submit" className="button-primary" disabled={loading}>
                      {loading ? 'A iniciar sessão...' : 'Iniciar sessão'}
                    </button>

                    <button
                      type="button"
                      className="button-primary admin-login-google-btn"
                      disabled={loadingGoogle || loading}
                      onClick={handleGoogleLogin}
                      style={{ background: '#fff', color: '#333', border: '1px solid #bdbdbd' }}
                    >
                      {loadingGoogle ? 'A redirecionar…' : 'Continuar com Google'}
                    </button>

                    <div className="admin-login-form-links">
                      <button type="button" className="link-button" onClick={() => switchMode('register')}>
                        Registar
                      </button>
                      <button type="button" className="link-button" onClick={() => switchMode('reset')}>
                        Repor senha
                      </button>
                    </div>
                  </form>
                </>
              ) : mode === 'new-password' ? (
                <>
                  <p className="admin-login-intro">
                    Defina a nova senha para a sua conta AAMIHE.
                  </p>
                  <form className="admin-login-form" onSubmit={handleConfirmNewPassword}>
                    {error ? <div className="admin-login-error">{error}</div> : null}
                    {success ? <div className="admin-login-success">{success}</div> : null}

                    <div className="wp-pwd">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="new_password"
                        className="input password-input"
                        placeholder="Nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="wp-hide-pw"
                        aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowNewPassword((prev) => !prev)}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="wp-pwd">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        name="confirm_new_password"
                        className="input password-input"
                        placeholder="Confirmar nova senha"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="wp-hide-pw"
                        aria-label={showConfirmNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                      >
                        {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <button type="submit" className="button-primary" disabled={loading}>
                      {loading ? 'A guardar...' : 'Guardar nova senha'}
                    </button>

                    <div className="admin-login-form-links admin-login-form-links--center">
                      <button type="button" className="link-button" onClick={() => switchMode('login')}>
                        Voltar ao login
                      </button>
                    </div>
                  </form>
                </>
              ) : mode === 'register' ? (
                <>
                  <form className="admin-login-form" onSubmit={handleRegister}>
                    {error ? <div className="admin-login-error">{error}</div> : null}

                    <input
                      type="text"
                      name="company_url"
                      className="admin-login-honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      aria-hidden="true"
                    />

                    <input
                      type="text"
                      name="username"
                      className="input"
                      placeholder="Nome de utilizador"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                    />

                    <input
                      type="email"
                      name="email"
                      className="input"
                      placeholder="Endereço de email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />

                    <div className="wp-pwd">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="input password-input"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="wp-hide-pw"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="wp-pwd">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className="input password-input"
                        placeholder="Confirmar senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="wp-hide-pw"
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="admin-login-action-row">
                      <AdminLoginMathChallenge
                        mathA={registerChallenge.a}
                        mathB={registerChallenge.b}
                        answer={registerMathAnswer}
                        onAnswerChange={setRegisterMathAnswer}
                        label="Desafio"
                      />
                      <button
                        type="submit"
                        className="button-primary admin-login-action-btn"
                        disabled={loading || !registerMathOk}
                      >
                        {loading ? 'A registar...' : 'Registar'}
                      </button>
                    </div>

                    <div className="admin-login-form-links admin-login-form-links--center">
                      <button type="button" className="link-button" onClick={() => switchMode('login')}>
                        Já tem conta? Iniciar sessão
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <p className="admin-login-intro">
                    Indique o email da sua conta. Enviaremos um link para repor a senha.
                  </p>
                  <form className="admin-login-form" onSubmit={handleResetPassword}>
                    {error ? <div className="admin-login-error">{error}</div> : null}
                    {success ? <div className="admin-login-success">{success}</div> : null}

                    <input
                      type="text"
                      name="company_url"
                      className="admin-login-honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      aria-hidden="true"
                    />

                    <input
                      type="email"
                      name="reset_email"
                      className="input"
                      placeholder="Endereço de email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />

                    <div className="admin-login-action-row">
                      <AdminLoginMathChallenge
                        mathA={resetChallenge.a}
                        mathB={resetChallenge.b}
                        answer={resetMathAnswer}
                        onAnswerChange={setResetMathAnswer}
                        label="Desafio"
                      />
                      <button
                        type="submit"
                        className="button-primary admin-login-action-btn"
                        disabled={loading || !resetMathOk}
                      >
                        {loading ? 'A enviar...' : 'Enviar link'}
                      </button>
                    </div>

                    <div className="admin-login-form-links admin-login-form-links--center">
                      <button type="button" className="link-button" onClick={() => switchMode('login')}>
                        Voltar ao login
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <p className="admin-login-back">
              <Link href="/">&larr; Ir para AAMIHE</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
