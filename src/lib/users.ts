import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { scryptSync, timingSafeEqual, randomBytes } from 'node:crypto';

const USERS_PATH = path.join(process.cwd(), 'aamihe_users.json');

export const USER_ROLES = [
  'Administrador',
  'Editor',
  'Actor',
  'Subscritor',
  'Contribuidor',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  alcunha: string;
  displayNameType: string;
  website: string;
  bio: string;
  telefone: string;
  profissao: string;
  cargo: string;
  avatar_url: string;
  created_at: string;
};

type UsersDb = {
  users: StoredUser[];
};

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

async function readUsersDb(): Promise<UsersDb> {
  try {
    const raw = await readFile(USERS_PATH, 'utf8');
    return normalizeUsersDb(JSON.parse(raw));
  } catch {
    return { users: [] };
  }
}

async function writeUsersDb(db: UsersDb) {
  await writeFile(USERS_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function normalizeUser(user: Partial<StoredUser> & Pick<StoredUser, 'id' | 'username' | 'email'>): StoredUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash || '',
    passwordSalt: user.passwordSalt || '',
    role: (user.role as UserRole) || 'Subscritor',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    alcunha: user.alcunha || '',
    displayNameType: user.displayNameType || 'full_name',
    website: user.website || '',
    bio: user.bio || '',
    telefone: user.telefone || '',
    profissao: user.profissao || '',
    cargo: user.cargo || '',
    avatar_url: user.avatar_url || '',
    created_at: user.created_at || new Date().toISOString(),
  };
}

function normalizeUsersDb(db: UsersDb): UsersDb {
  return {
    users: (db.users || []).map((user) => normalizeUser(user as StoredUser)),
  };
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, user: StoredUser) {
  const hash = hashPassword(password, user.passwordSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function getDisplayName(user: StoredUser) {
  if (user.displayNameType === 'alcunha' && user.alcunha) return user.alcunha;
  if (user.displayNameType === 'first_name' && user.firstName) return user.firstName;
  if (user.displayNameType === 'last_name' && user.lastName) return user.lastName;
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full || user.username;
}

export function mapUserToListItem(user: StoredUser): UserListItem {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    name: getDisplayName(user),
    email: user.email,
    role: user.role,
    alcunha: user.alcunha,
    displayNameType: user.displayNameType,
    articles: 0,
    avatar: user.avatar_url || null,
    isAdmin: user.role === 'Administrador',
  };
}

export function mapUserToProfile(user: StoredUser): UserProfile {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    alcunha: user.alcunha,
    displayNameType: user.displayNameType,
    role: user.role,
    bio: user.bio,
    website: user.website,
    avatar: user.avatar_url || null,
    isAdmin: user.role === 'Administrador',
    telefone: user.telefone,
    profissao: user.profissao,
    cargo: user.cargo,
  };
}

export async function listUsers() {
  const db = await readUsersDb();
  return db.users.map(mapUserToListItem);
}

export async function getUserById(id: string) {
  const db = await readUsersDb();
  const user = db.users.find((entry) => entry.id === id);
  return user ? mapUserToProfile(user) : null;
}

export async function findUserByLogin(login: string) {
  const db = await readUsersDb();
  const value = login.toLowerCase();
  return db.users.find(
    (user) => user.username.toLowerCase() === value || user.email.toLowerCase() === value,
  );
}

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  alcunha?: string;
  displayNameType?: string;
  role?: UserRole;
  website?: string;
  bio?: string;
  telefone?: string;
  profissao?: string;
  cargo?: string;
  avatarUrl?: string;
};

export async function createUser(input: CreateUserInput) {
  const db = await readUsersDb();
  const username = input.username.trim();
  const email = input.email.trim();
  const normalizedUsername = username.toLowerCase();
  const normalizedEmail = email.toLowerCase();

  if (!username || !email || !input.password) {
    throw new Error('Campos obrigatórios em falta.');
  }

  if (db.users.some((u) => u.username.toLowerCase() === normalizedUsername)) {
    throw new Error('Este nome de utilizador já existe.');
  }

  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Este email já está registado.');
  }

  const salt = randomBytes(16).toString('hex');
  const user = normalizeUser({
    id: `user_${Date.now()}_${randomBytes(4).toString('hex')}`,
    username,
    email,
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
    role: input.role || 'Subscritor',
    firstName: input.firstName || '',
    lastName: input.lastName || '',
    alcunha: input.alcunha || '',
    displayNameType: input.displayNameType || 'full_name',
    website: input.website || '',
    bio: input.bio || '',
    telefone: input.telefone || '',
    profissao: input.profissao || '',
    cargo: input.cargo || '',
    avatar_url: input.avatarUrl || '',
    created_at: new Date().toISOString(),
  });

  db.users.push(user);
  await writeUsersDb(db);
  return mapUserToProfile(user);
}

export type UpdateUserInput = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  alcunha?: string;
  displayNameType?: string;
  role?: UserRole;
  website?: string;
  bio?: string;
  telefone?: string;
  profissao?: string;
  cargo?: string;
  avatarUrl?: string;
  password?: string;
};

export async function updateUser(input: UpdateUserInput) {
  const db = await readUsersDb();
  const index = db.users.findIndex((user) => user.id === input.id);
  if (index === -1) {
    throw new Error('Utilizador não encontrado.');
  }

  const current = db.users[index];
  const email = input.email?.trim() || current.email;
  const normalizedEmail = email.toLowerCase();

  if (
    db.users.some(
      (user) => user.id !== input.id && user.email.toLowerCase() === normalizedEmail,
    )
  ) {
    throw new Error('Este email já está registado.');
  }

  const nextRole = current.role === 'Administrador' ? current.role : input.role || current.role;

  const updated = normalizeUser({
    ...current,
    email,
    firstName: input.firstName ?? current.firstName,
    lastName: input.lastName ?? current.lastName,
    alcunha: input.alcunha ?? current.alcunha,
    displayNameType: input.displayNameType ?? current.displayNameType,
    role: nextRole,
    website: input.website ?? current.website,
    bio: input.bio ?? current.bio,
    telefone: input.telefone ?? current.telefone,
    profissao: input.profissao ?? current.profissao,
    cargo: input.cargo ?? current.cargo,
    avatar_url: input.avatarUrl ?? current.avatar_url,
  });

  if (input.password) {
    const salt = randomBytes(16).toString('hex');
    updated.passwordSalt = salt;
    updated.passwordHash = hashPassword(input.password, salt);
  }

  db.users[index] = updated;
  await writeUsersDb(db);
  return mapUserToProfile(updated);
}

export async function deleteUser(id: string) {
  const db = await readUsersDb();
  const user = db.users.find((entry) => entry.id === id);
  if (!user) {
    throw new Error('Utilizador não encontrado.');
  }

  if (user.role === 'Administrador') {
    const adminCount = db.users.filter((entry) => entry.role === 'Administrador').length;
    if (adminCount <= 1) {
      throw new Error('Não é possível eliminar o último administrador.');
    }
  }

  db.users = db.users.filter((entry) => entry.id !== id);
  await writeUsersDb(db);
}

export async function deleteUsers(ids: string[]) {
  for (const id of ids) {
    await deleteUser(id);
  }
}
