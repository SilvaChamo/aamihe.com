'use client';

import { usePathname } from 'next/navigation';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import { LOGIN_PATH } from '@/lib/login-path';

/**
 * Loading de grupo (admin) — nunca mostrar skeleton do painel na página de login.
 */
export default function AdminAreaLoading() {
  const pathname = usePathname();
  const isLogin =
    pathname === LOGIN_PATH ||
    pathname.startsWith(`${LOGIN_PATH}/`) ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/');

  if (!pathname || isLogin) {
    return null;
  }

  const variant = pathname === '/dashboard' || pathname === '/admin/dashboard' ? 'dashboard' : 'default';

  return (
    <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
      <AdminPanelLoading variant={variant} />
    </div>
  );
}
