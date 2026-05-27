import type { UserRole } from '@/types/auth';
import { isPlatformAdminEmail } from '@/lib/auth/platform-admins';

export function metadataRoleToAppRole(
  metadataRole: string | undefined | null,
  email?: string | undefined | null
): UserRole {
  if (isPlatformAdminEmail(email)) return 'admin';
  const r = String(metadataRole || '')
    .trim()
    .toLowerCase();
  if (r === 'administrador' || r === 'admin') return 'admin';
  if (r === 'editor') return 'editor';
  if (r === 'contribuidor' || r === 'actor') return 'contribuidor';
  return 'guest';
}

export function appRoleToSignupMetadataRole(role: UserRole): string {
  if (role === 'admin') return 'Administrador';
  if (role === 'editor') return 'Editor';
  if (role === 'contribuidor') return 'Contribuidor';
  return 'Subscritor';
}
