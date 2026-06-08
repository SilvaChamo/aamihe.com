'use client';

import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useMenuPrivileges } from '@/hooks/useMenuPrivileges';
import {
  isStaffMenuEnabled,
  isStaffSubmenuEnabled,
  type StaffMenuKey,
} from '@/lib/menu-privileges';

export function useStaffMenuAccess() {
  const { privileges } = useMenuPrivileges();
  const { isAdmin } = useAdminPermissions();

  const canAccessMenu = (key: StaffMenuKey) =>
    isStaffMenuEnabled(privileges, key, isAdmin);

  const canAccessSubmenu = (parent: StaffMenuKey, childKey: string) =>
    isStaffSubmenuEnabled(privileges, parent, childKey, isAdmin);

  return { privileges, isAdmin, canAccessMenu, canAccessSubmenu };
}
