'use client';

import { permissionsFromRole } from '@/lib/admin-permissions';
import { useSessionUser } from '@/hooks/useSessionUser';

export function useAdminPermissions() {
  const { user, loading, isSubscriber } = useSessionUser();
  const role = user?.role || '';
  const perms = permissionsFromRole(role, Boolean(user?.isAdmin));

  return {
    ...perms,
    loading,
    isSubscriber,
    user,
  };
}
