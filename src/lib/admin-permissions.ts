import { isSubscriberRole, type UserRole } from '@/lib/user-types';

export function isActorRole(role: string): boolean {
  return role === 'Actor';
}

export function canManageNews(role: string): boolean {
  return role === 'Administrador' || role === 'Editor';
}

export function canViewNewsAdmin(role: string): boolean {
  return canManageNews(role) || isActorRole(role);
}

export function canManageUsers(role: string): boolean {
  return role === 'Administrador' || role === 'Editor';
}

export function isStaffRole(role: string): boolean {
  return !isSubscriberRole(role);
}

export function isSubscriberOnlyDashboardPath(pathname: string): boolean {
  if (pathname === '/dashboard') return true;
  const prefixes = [
    '/dashboard/minha-conta',
    '/dashboard/meus-documentos',
    '/dashboard/notificacoes',
    '/dashboard/definicoes-conta',
    '/dashboard/submissao-resumo',
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function staffDashboardPathToAdmin(pathname: string): string | null {
  if (!pathname.startsWith('/dashboard') || isSubscriberOnlyDashboardPath(pathname)) {
    return null;
  }
  return pathname.replace(/^\/dashboard/, '/admin');
}

export type AdminPermissions = {
  role: UserRole | '';
  canManageNews: boolean;
  canViewNews: boolean;
  canManageUsers: boolean;
  isActor: boolean;
  isAdmin: boolean;
};

export function permissionsFromRole(role: string, isAdmin = false): AdminPermissions {
  return {
    role: (role as UserRole) || '',
    canManageNews: canManageNews(role) || isAdmin,
    canViewNews: canViewNewsAdmin(role) || isAdmin,
    canManageUsers: canManageUsers(role) || isAdmin,
    isActor: isActorRole(role),
    isAdmin: isAdmin || role === 'Administrador',
  };
}
