'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminShell from '@/components/Admin/AdminShell';
import AdminAuthGate from '@/components/Admin/AdminAuthGate';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin/login' || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <AdminAuthGate>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGate>
  );
}
