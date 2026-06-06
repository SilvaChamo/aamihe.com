/** Prefixo dos cookies de sessão Supabase (sb-<ref>-auth-token). */
export function getSupabaseAuthStorageKey(supabaseUrl?: string): string {
  const raw = supabaseUrl?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  try {
    const ref = new URL(raw).hostname.split('.')[0] || 'supabase';
    return `sb-${ref}-auth-token`;
  } catch {
    return 'sb-supabase-auth-token';
  }
}

const AUTH_COOKIE_RE = /^sb-[\w-]+-auth-token(\.\d+)?$/;
const CODE_VERIFIER_RE = /^sb-[\w-]+-auth-token-code-verifier$/;

/** Projectos Supabase antigos (cloud) — remover sempre após migrar para Hetzner. */
const LEGACY_AUTH_PREFIXES = ['sb-gwankhxcbkrtgxopbxwd-auth-token'];

export function isSupabaseAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_RE.test(name) || CODE_VERIFIER_RE.test(name);
}

export function isLegacySupabaseAuthCookie(name: string): boolean {
  if (!isSupabaseAuthCookieName(name)) return false;
  const base = name.replace(/\.\d+$/, '');
  return LEGACY_AUTH_PREFIXES.some((prefix) => base === prefix || base.startsWith(`${prefix}-`));
}

export function isStaleSupabaseAuthCookie(name: string, activeKey: string): boolean {
  if (isLegacySupabaseAuthCookie(name)) return true;
  if (!isSupabaseAuthCookieName(name)) return false;
  const base = name.replace(/\.\d+$/, '');
  const activeBase = activeKey.replace(/\.\d+$/, '');
  if (base === activeBase) return false;
  if (base === `${activeBase}-code-verifier`) return false;
  return true;
}

function deleteCookie(response: { cookies: { delete: (name: string) => void } }, name: string) {
  response.cookies.delete(name);
}

/** Remove cookies Supabase obsoletos (cloud, projectos antigos). */
export function clearStaleSupabaseAuthCookiesFromRequest(
  cookies: { name: string }[],
  response: { cookies: { delete: (name: string) => void } },
  supabaseUrl?: string,
): number {
  const activeKey = getSupabaseAuthStorageKey(supabaseUrl);
  let cleared = 0;
  for (const cookie of cookies) {
    if (isStaleSupabaseAuthCookie(cookie.name, activeKey)) {
      deleteCookie(response, cookie.name);
      cleared += 1;
    }
  }
  return cleared;
}

/** No browser: apaga cookies sb-* obsoletos (evita HTTP 431). */
export function clearStaleSupabaseAuthCookiesInBrowser(supabaseUrl?: string): void {
  if (typeof document === 'undefined') return;
  const activeKey = getSupabaseAuthStorageKey(supabaseUrl);
  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0]?.trim();
    if (!name || !isStaleSupabaseAuthCookie(name, activeKey)) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

/** Apaga todos os cookies de auth Supabase (sessão reset). */
export function clearAllSupabaseAuthCookiesInBrowser(): void {
  if (typeof document === 'undefined') return;
  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0]?.trim();
    if (!name || !isSupabaseAuthCookieName(name)) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}
