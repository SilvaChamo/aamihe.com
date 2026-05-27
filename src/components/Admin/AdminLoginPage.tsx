'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { setAdminSecret } from '@/lib/admin-auth';
import './AdminLoginPage.css';

type AuthMode = 'login' | 'register';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAABeKvhulGQywv3RQ';

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
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setTurnstileToken('');
    setHoneypot('');
    if (nextMode === 'register') {
      setSuccess('');
    }
  }

  function mountTurnstile() {
    const container = turnstileRef.current;
    if (!container || !window.turnstile) return;

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    container.innerHTML = '';
    setTurnstileToken('');

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      size: 'flexible',
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
    });
  }

  useEffect(() => {
    if (!turnstileReady) return;

    const timer = window.setTimeout(mountTurnstile, 80);

    return () => {
      window.clearTimeout(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [turnstileReady, mode]);

  function resetTurnstileWidget() {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setTurnstileToken('');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          remember: rememberMe,
          turnstileToken,
          honeypot,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Não foi possível iniciar sessão.');
        resetTurnstileWidget();
        return;
      }

      setAdminSecret(result.token);
      onSuccess?.();
      router.push(redirectTo);
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
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
          turnstileToken,
          honeypot,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Não foi possível concluir o registo.');
        resetTurnstileWidget();
        return;
      }

      setSuccess('Conta criada com sucesso. Já pode iniciar sessão.');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setTurnstileToken('');
      setMode('login');
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setTurnstileReady(true)}
        onLoad={() => setTurnstileReady(true)}
      />

      <div className="admin-login-page">
        <div className="admin-login-left">
          <div className="admin-login-logo-panel">
            <Link href="/" className="admin-login-logo" aria-label="AAMIHE">
              AAMIHE
            </Link>
          </div>
        </div>

        <div className="admin-login-panel">
          <div className="admin-login-panel-inner">
            <div className="admin-login-card">
              <div className="admin-login-form-box">
                <form
                  className="admin-login-form"
                  onSubmit={mode === 'login' ? handleLogin : handleRegister}
                >
                  {error ? <div className="admin-login-error">{error}</div> : null}
                  {success && mode === 'login' ? (
                    <div className="admin-login-success">{success}</div>
                  ) : null}

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

                  {mode === 'login' ? (
                    <>
                      <input
                        type="text"
                        name="log"
                        className="input"
                        placeholder="Nome de utilizador ou endereço de email"
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
                    </>
                  ) : (
                    <>
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
                    </>
                  )}

                  <div className="cf-turnstile-wrapper">
                    <div ref={turnstileRef} className="cf-turnstile-mount" />
                  </div>

                  {mode === 'login' ? (
                    <label className="forgetmenot">
                      <input
                        name="rememberme"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Manter sessão</span>
                    </label>
                  ) : null}

                  <button type="submit" className="button-primary" disabled={loading}>
                    {loading
                      ? mode === 'login'
                        ? 'A iniciar sessão...'
                        : 'A registar...'
                      : mode === 'login'
                        ? 'Iniciar sessão'
                        : 'Registar'}
                  </button>

                  {mode === 'login' ? (
                    <div className="admin-login-form-links">
                      <button type="button" className="link-button" onClick={() => switchMode('register')}>
                        Registar
                      </button>
                      <Link href="/admin/login?action=lostpassword">Repor senha</Link>
                    </div>
                  ) : (
                    <div className="admin-login-form-links admin-login-form-links--center">
                      <button type="button" className="link-button" onClick={() => switchMode('login')}>
                        Já tem conta? Iniciar sessão
                      </button>
                    </div>
                  )}
                </form>
              </div>

              <p className="admin-login-back">
                <Link href="/">&larr; Ir para AAMIHE</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
