'use client';

import type { UserProfile } from '@/lib/user-types';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

const PROFILE_KEY = 'aamihe_session_profile';

export function getSessionProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setSessionProfile(profile: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (profile) {
    window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } else {
    window.sessionStorage.removeItem(PROFILE_KEY);
  }
}

export async function clearAdminSecret() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  setSessionProfile(null);
}

/** @deprecated use Supabase session */
export function getAdminSecret(): string {
  return '';
}

/** @deprecated use Supabase session */
export function getLoggedUsername(): string {
  return getSessionProfile()?.username || '';
}

/** @deprecated use Supabase session */
export function setAdminSecret(_secret: string, _username?: string, profile?: UserProfile | null) {
  setSessionProfile(profile ?? null);
}

export async function adminFetch(input: string, init: RequestInit = {}) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const username = getSessionProfile()?.username;
  if (username) headers.set('X-Logged-Username', username);

  return fetch(input, {
    ...init,
    headers,
    credentials: 'same-origin',
  });
}

export async function signInWithGoogle() {
  const supabase = getSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(email: string) {
  const supabase = getSupabaseBrowserClient();
  const origin = window.location.origin;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/admin/login?action=new-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
