'use client';

import type { UserProfile } from '@/lib/user-types';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';

import { CLIENT_CACHE_TTL_MS, isCacheEntryFresh } from '@/lib/client-cache';

const PROFILE_KEY = 'aamihe_session_profile';
const PROFILE_FETCHED_AT_KEY = 'aamihe_session_profile_at';

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
    window.sessionStorage.setItem(PROFILE_FETCHED_AT_KEY, String(Date.now()));
  } else {
    window.sessionStorage.removeItem(PROFILE_KEY);
    window.sessionStorage.removeItem(PROFILE_FETCHED_AT_KEY);
  }
}

/** Perfil em sessionStorage ainda válido (24 h) — evita /api/admin/users/me em cada visita. */
export function isSessionProfileCacheFresh(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getSessionProfile()) return false;
  const raw = window.sessionStorage.getItem(PROFILE_FETCHED_AT_KEY);
  if (!raw) return false;
  const fetchedAt = Number(raw);
  return Number.isFinite(fetchedAt) && isCacheEntryFresh(fetchedAt);
}

export { CLIENT_CACHE_TTL_MS };

export async function clearAdminSecret() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  clearAdminAccessTokenCache();
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

let cachedAccessToken: string | null = null;
let cachedTokenExpiresAtMs = 0;

async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && now < cachedTokenExpiresAtMs - 60_000) {
    return cachedAccessToken;
  }

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  cachedAccessToken = session?.access_token ?? null;
  cachedTokenExpiresAtMs = session?.expires_at ? session.expires_at * 1000 : now + 3_600_000;
  return cachedAccessToken;
}

export function clearAdminAccessTokenCache() {
  cachedAccessToken = null;
  cachedTokenExpiresAtMs = 0;
}

export async function adminFetch(input: string, init: RequestInit = {}) {
  const token = await getAccessToken();

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
    redirectTo: `${origin}/auth/confirm?next=/dashboard/login?action=new-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
