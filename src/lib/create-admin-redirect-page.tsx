import { redirect } from 'next/navigation';

/** Redireciona rotas /dashboard/* (staff) para o equivalente em /admin/*. */
export function createDashboardStaffRedirect(adminPath: string) {
  return function DashboardStaffRedirect() {
    redirect(adminPath);
  };
}
