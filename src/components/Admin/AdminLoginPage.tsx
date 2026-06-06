'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  requestPasswordReset,
  setSessionProfile,
  signInWithGoogle,
  updatePassword,
} from '@/lib/admin-auth';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { readApiJsonResponse, safeErrorMessage } from '@/lib/safe-error-message';
import { isSubscriberRole, type UserProfile } from '@/lib/user-types';
import AdminLoginMathChallenge, { createLoginMathChallenge } from '@/components/Admin/AdminLoginMathChallenge';
import { verifyMathCaptcha } from '@/lib/math-captcha';
import { clearStaleSupabaseAuthCookiesInBrowser } from '@/lib/supabase-auth-cookies';
import './AdminLoginPage.css';

function GoogleIcon() {
  return (
    <svg
      className="admin-login-google-icon"
      viewBox="0 0 48 48"
      width="24"
      height="24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

type AuthMode = 'login' | 'register' | 'reset' | 'new-password';

function formatApiError(value: unknown, fallback: string): string {
  return safeErrorMessage(value, fallback);
}

interface AdminLoginPageProps {
  redirectTo?: string;
  onSuccess?: () => void;
  initialMode?: AuthMode;
}

export default function AdminLoginPage(props: AdminLoginPageProps) {
  return (
    <Suspense fallback={null}>
      <AdminLoginPageInner {...props} />
    </Suspense>
  );
}

function AdminLoginPageInner({
  redirectTo = '/dashboard',
  onSuccess,
  initialMode = 'login',
}: AdminLoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    clearStaleSupabaseAuthCookiesInBrowser();
  }, []);

  useEffect(() => {
    const desc = searchParams.get('error_description');
    if (desc) {
      const decoded = decodeURIComponent(desc.replace(/\+/g, ' '));
      setError(safeErrorMessage(decoded, 'Não foi possível iniciar sessão.'));
    }
  }, [searchParams]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
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
        credentials: 'same-origin',
        body: JSON.stringify({
          login: username.trim(),
          password,
        }),
      });

      const { data: result } = await readApiJsonResponse(response);

      if (!response.ok || !result.success) {
        setError(
          formatApiError(
            result.error,
            response.status === 401
              ? 'Email, nome, alcunha ou senha incorrectos.'
              : response.status === 503
                ? 'Serviço de autenticação indisponível. Tente com o email completo ou contacte a administração.'
                : 'Não foi possível iniciar sessão.',
          ),
        );
        return;
      }

      const tokens = result.session as
        | { access_token?: string; refresh_token?: string }
        | undefined;
      if (tokens?.access_token && tokens?.refresh_token) {
        const supabase = getSupabaseBrowserClient();
        const { error: browserSessionError } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (browserSessionError) {
          setError('Sessão incompleta no browser. Tente iniciar sessão novamente.');
          return;
        }
      }

      const profile = result.user as UserProfile | undefined;
      setSessionProfile(profile ?? null);
      onSuccess?.();
      const target =
        profile && isSubscriberRole(profile.role)
          ? '/dashboard'
          : redirectTo.startsWith('/dashboard')
            ? redirectTo
            : '/dashboard';
      router.replace(target);
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
          formLoadedAt: resetLoadedAt,
          mathA: resetChallenge.a,
          mathB: resetChallenge.b,
          mathAnswer: Number(resetMathAnswer),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          formatApiError(
            result.error,
            'Não foi possível enviar o email. Configure SMTP no Supabase (Authentication → SMTP).',
          ),
        );
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
      <div className="admin-login-left" role="img" aria-label="" />

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
                      name="log"
                      className="input"
                      placeholder="Email, nome, alcunha ou utilizador"
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

                    <div className="admin-login-submit-row">
                      <button
                        type="submit"
                        className="button-primary admin-login-submit-btn"
                        disabled={loading || loadingGoogle}
                      >
                        {loading ? 'A iniciar sessão...' : 'Iniciar sessão'}
                      </button>
                      <button
                        type="button"
                        className="admin-login-google-icon-btn"
                        disabled={loadingGoogle || loading}
                        onClick={handleGoogleLogin}
                        aria-label="Iniciar sessão com Google"
                        title="Iniciar sessão com Google"
                      >
                        {loadingGoogle ? (
                          <span className="admin-login-google-spinner" aria-hidden="true" />
                        ) : (
                          <GoogleIcon />
                        )}
                      </button>
                    </div>

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
