'use client';

import { usePathname } from 'next/navigation';
import AdminLoginSkeleton from '@/components/Admin/AdminLoginSkeleton';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import { LOGIN_PATH } from '@/lib/login-path';

/** Só o conteúdo — o layout já inclui AdminShell (evita segunda barra lateral escura). */
export default function AdminAreaLoading() {
  const pathname = usePathname();
  const isLogin =
    pathname === LOGIN_PATH || pathname === '/admin/login' || pathname === '/login';

  if (isLogin) {
    return <AdminLoginSkeleton />;
  }

  const variant = pathname === '/dashboard' || pathname === '/admin/dashboard' ? 'dashboard' : 'default';

  return (
    <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
      <AdminPanelLoading variant={variant} />
    </div>
  );
}
