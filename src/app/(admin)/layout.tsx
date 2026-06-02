'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminShell from '@/components/Admin/AdminShell';
import AdminAuthGate from '@/components/Admin/AdminAuthGate';
import { LOGIN_PATH } from '@/lib/login-path';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPath =
    pathname === LOGIN_PATH ||
    pathname.startsWith(`${LOGIN_PATH}/`) ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/');

  if (isLoginPath) {
    return <>{children}</>;
  }

  return (
    <AdminAuthGate>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGate>
  );
}
