'use client';

import { usePathname } from 'next/navigation';
import { useSessionUser } from '@/hooks/useSessionUser';

export type AdminBase = '/admin' | '/dashboard';

/** Prefixo de rotas para links do painel — subscritor usa /dashboard, staff usa /admin. */
export function useAdminBase(): AdminBase {
  const pathname = usePathname();
  const { isSubscriber, loading } = useSessionUser();

  if (!loading && isSubscriber) return '/dashboard';
  if (!loading) return '/admin';

  return pathname.startsWith('/dashboard') ? '/dashboard' : '/admin';
}

export function adminHref(base: AdminBase, ...parts: string[]): string {
  const path = [base, ...parts].filter(Boolean).join('/');
  return path.replace(/\/+/g, '/');
}
