import { redirect } from 'next/navigation';

/** Alias legado: /admin/* → /dashboard/* (painel único). */
export function createAdminAliasRedirect(dashboardPath: string) {
  return function AdminAliasRedirect() {
    redirect(dashboardPath);
  };
}
