const STORAGE_KEY = 'aamihe_admin_secret';

export function getAdminSecret(): string {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(STORAGE_KEY) || '';
}

export function setAdminSecret(secret: string) {
  window.sessionStorage.setItem(STORAGE_KEY, secret);
}

export function clearAdminSecret() {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export async function adminFetch(input: string, init: RequestInit = {}) {
  const secret = getAdminSecret();
  const headers = new Headers(init.headers);
  if (secret) headers.set('Authorization', `Bearer ${secret}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
