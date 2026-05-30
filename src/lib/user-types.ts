export const USER_ROLES = [
  'Administrador',
  'Editor',
  'Actor',
  'Subscritor',
  'Contribuidor',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserListItem = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: UserRole;
  alcunha: string;
  displayNameType: string;
  articles: number;
  avatar: string | null;
  isAdmin: boolean;
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  alcunha: string;
  displayNameType: string;
  role: UserRole;
  bio: string;
  website: string;
  avatar: string | null;
  isAdmin: boolean;
  telefone: string;
  profissao: string;
  cargo: string;
};

export function isSubscriberRole(role: string) {
  return role === 'Subscritor';
}

export function resolveUserDisplayName(user: {
  firstName?: string;
  lastName?: string;
  alcunha?: string;
  displayNameType?: string;
  username: string;
}): string {
  if (user.displayNameType === 'alcunha' && user.alcunha) return user.alcunha;
  if (user.displayNameType === 'first_name' && user.firstName) return user.firstName;
  if (user.displayNameType === 'last_name' && user.lastName) return user.lastName;
  const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return full || user.alcunha || user.username;
}

export function displayNameTypeLabel(type: string): string {
  if (type === 'first_name') return 'Nome próprio';
  if (type === 'last_name') return 'Apelido';
  if (type === 'alcunha') return 'Alcunha';
  return 'Nome e apelido';
}
