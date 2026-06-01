'use client';

import { usePathname } from 'next/navigation';
import AdminLoginSkeleton from '@/components/Admin/AdminLoginSkeleton';
import AdminShellSkeleton from '@/components/Admin/AdminShellSkeleton';
import { LOGIN_PATH } from '@/lib/login-path';

export default function AdminAreaLoading() {
  const pathname = usePathname();
  const isLogin =
    pathname === LOGIN_PATH || pathname === '/admin/login' || pathname === '/login';

  if (isLogin) {
    return <AdminLoginSkeleton />;
  }

  return <AdminShellSkeleton />;
}
