'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import FormAntiSpam from '@/components/FormAntiSpam';
import { validateSpamFromForm } from '@/lib/form-spam-guard';
import { setSessionProfile } from '@/lib/admin-auth';
import { useLanguage } from '@/context/LanguageContext';
import { commonUiCopy } from '@/i18n/messages';
import styles from './ConferenceParticipantRegisterForm.module.css';

export type ConferenceRegisterFormLabels = {
  title: string;
  intro: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  submit: string;
  submitting: string;
  error: string;
  security: string;
  loginHint: string;
  loginLink: string;
};

type ConferenceParticipantRegisterFormProps = {
  labels: ConferenceRegisterFormLabels;
};

export default function ConferenceParticipantRegisterForm({
  labels,
}: ConferenceParticipantRegisterFormProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const ui = commonUiCopy[locale];
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const spam = validateSpamFromForm(e.currentTarget);
    if (!spam.ok) {
      setError(spam.error);
      return;
    }

    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const registerRes = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          honeypot: String(formData.get('company_url') ?? '').trim(),
          formLoadedAt: Number(formData.get('form_loaded_at') ?? 0),
          mathA: Number(formData.get('math_a')),
          mathB: Number(formData.get('math_b')),
          mathAnswer: Number(formData.get('math_answer')),
        }),
      });

      const registerResult = await registerRes.json();

      if (!registerRes.ok || !registerResult.success) {
        setError(registerResult.error || labels.error);
        return;
      }

      const loginRes = await fetch('/api/admin/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: email.trim(),
          password,
          honeypot: '',
        }),
      });

      const loginResult = await loginRes.json();

      if (!loginRes.ok || !loginResult.success) {
        router.push('/dashboard/login');
        return;
      }

      setSessionProfile(loginResult.user ?? null);
      router.push('/dashboard');
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <label>
          {labels.username}
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          {labels.email}
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <div className={styles.passwordRow}>
          <label>
            {labels.password}
            <span className={styles.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                aria-label={showPassword ? ui.hidePassword : ui.showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <label>
            {labels.confirmPassword}
            <span className={styles.passwordField}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                aria-label={showConfirmPassword ? ui.hidePassword : ui.showPassword}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>
        </div>

        <FormAntiSpam mathLabel={labels.security} mathClassName={styles.mathCaptcha} />

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? labels.submitting : labels.submit}
        </button>
      </form>

      <p className={styles.loginHint}>
        {labels.loginHint}{' '}
        <Link href="/dashboard/login?next=/dashboard" className={styles.loginLink}>
          {labels.loginLink}
        </Link>
      </p>
    </div>
  );
}
