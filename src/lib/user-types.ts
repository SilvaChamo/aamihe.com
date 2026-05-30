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
