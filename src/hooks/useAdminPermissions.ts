'use client';

import { getSessionProfile } from '@/lib/admin-auth';
import { permissionsFromRole } from '@/lib/admin-permissions';
import { useSessionUser } from '@/hooks/useSessionUser';

export function useAdminPermissions() {
  const { user, loading, isSubscriber } = useSessionUser();
  const effectiveUser = user ?? getSessionProfile();
  const role = effectiveUser?.role || '';
  const perms = permissionsFromRole(role, Boolean(effectiveUser?.isAdmin));

  return {
    ...perms,
    loading,
    isSubscriber,
    user: effectiveUser,
  };
}
