import type { UserProfile } from '@/lib/user-types';

const STORAGE_KEY = 'aamihe_admin_secret';
const USERNAME_KEY = 'aamihe_admin_username';
const PROFILE_KEY = 'aamihe_admin_profile';

export function getAdminSecret(): string {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(STORAGE_KEY) || '';
}

export function getLoggedUsername(): string {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(USERNAME_KEY) || '';
}

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

export function setAdminSecret(secret: string, username?: string, profile?: UserProfile | null) {
  window.sessionStorage.setItem(STORAGE_KEY, secret);
  if (username?.trim()) {
    window.sessionStorage.setItem(USERNAME_KEY, username.trim());
  } else {
    window.sessionStorage.removeItem(USERNAME_KEY);
  }
  setSessionProfile(profile ?? null);
}

export function clearAdminSecret() {
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(USERNAME_KEY);
  window.sessionStorage.removeItem(PROFILE_KEY);
}

export async function adminFetch(input: string, init: RequestInit = {}) {
  const secret = getAdminSecret();
  const headers = new Headers(init.headers);
  if (secret) headers.set('Authorization', `Bearer ${secret}`);
  const username = getLoggedUsername();
  if (username) headers.set('X-Logged-Username', username);

  return fetch(input, {
    ...init,
    headers,
  });
}
