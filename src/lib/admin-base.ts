'use client';

import { usePathname } from 'next/navigation';

export type AdminBase = '/admin' | '/dashboard';

export function useAdminBase(): AdminBase {
  const pathname = usePathname();
  return pathname.startsWith('/dashboard') ? '/dashboard' : '/admin';
}

export function adminHref(base: AdminBase, ...parts: string[]): string {
  const path = [base, ...parts].filter(Boolean).join('/');
  return path.replace(/\/+/g, '/');
}
