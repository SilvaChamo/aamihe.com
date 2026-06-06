'use client';

/** Prefixo único do painel — sempre /dashboard (sem alternar com /admin). */
export type AdminBase = '/dashboard';

export function useAdminBase(): AdminBase {
  return '/dashboard';
}

export function adminHref(base: AdminBase, ...parts: string[]): string {
  const path = [base, ...parts].filter(Boolean).join('/');
  return path.replace(/\/+/g, '/');
}
