import type { User as AuthUser } from '@supabase/supabase-js';
import {
  USER_ROLES,
  isSubscriberRole,
  type UserListItem,
  type UserProfile,
  type UserRole,
} from '@/lib/user-types';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export { USER_ROLES, isSubscriberRole, type UserListItem, type UserProfile, type UserRole };

function normalizeAvatarUrl(url: string | null | undefined): string | null {
  return resolveAvatarUrl(url);
}

const TABLE = 'aamihe_user_profiles';

const PROFILE_SELECT =
  'id,username,email,first_name,last_name,alcunha,display_name_type,role,bio,website,avatar_url,telefone,profissao,cargo,created_at,updated_at';

type ProfileRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  alcunha: string;
  display_name_type: string;
  role: UserRole;
  bio: string;
  website: string;
  avatar_url: string;
  telefone: string;
  profissao: string;
  cargo: string;
  created_at: string;
  updated_at: string;
};

function adminClient() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase não configurado (SUPABASE_SERVICE_ROLE_KEY).');
  }
  return client;
}

function getDisplayName(row: Pick<ProfileRow, 'username' | 'first_name' | 'last_name' | 'alcunha' | 'display_name_type'>) {
  if (row.display_name_type === 'alcunha' && row.alcunha) return row.alcunha;
  if (row.display_name_type === 'first_name' && row.first_name) return row.first_name;
  if (row.display_name_type === 'last_name' && row.last_name) return row.last_name;
  const full = `${row.first_name} ${row.last_name}`.trim();
  return full || row.alcunha || row.username;
}

function rowToListItem(row: ProfileRow): UserListItem {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    name: getDisplayName(row),
    email: row.email,
    role: row.role,
    alcunha: row.alcunha,
    displayNameType: row.display_name_type,
    articles: 0,
    avatar: normalizeAvatarUrl(row.avatar_url),
    isAdmin: row.role === 'Administrador',
  };
}

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    alcunha: row.alcunha,
    displayNameType: row.display_name_type,
    role: row.role,
    bio: row.bio,
    website: row.website,
    avatar: normalizeAvatarUrl(row.avatar_url),
    isAdmin: row.role === 'Administrador',
    telefone: row.telefone,
    profissao: row.profissao,
    cargo: row.cargo,
  };
}

export const mapUserToProfile = rowToProfile;
export const mapUserToListItem = rowToListItem;

function normalizeRole(role?: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'Subscritor';
}


export async function ensureProfileFromAuthUser(user: AuthUser, defaults?: Partial<CreateUserInput>) {
  const admin = adminClient();
  const { data: existing } = await admin.from(TABLE).select('id').eq('id', user.id).maybeSingle();
  if (existing) return;

  const email = (user.email || defaults?.email || '').trim().toLowerCase();
  const meta = user.user_metadata || {};
  const username =
    defaults?.username?.trim() ||
    String(meta.username || meta.full_name || email.split('@')[0] || 'utilizador').trim();

  await admin.from(TABLE).insert({
    id: user.id,
    username,
    email,
    first_name: defaults?.firstName || String(meta.first_name || meta.given_name || meta.name || '').split(' ')[0] || '',
    last_name: defaults?.lastName || String(meta.last_name || meta.family_name || '').trim(),
    alcunha: defaults?.alcunha || '',
    display_name_type: defaults?.displayNameType || 'full_name',
    role: normalizeRole(defaults?.role),
    bio: defaults?.bio || '',
    website: defaults?.website || '',
    avatar_url: defaults?.avatarUrl || String(meta.avatar_url || user.user_metadata?.avatar_url || ''),
    telefone: defaults?.telefone || '',
    profissao: defaults?.profissao || '',
    cargo: defaults?.cargo || '',
  });
}

export async function listUsers() {
  const admin = adminClient();
  const { data, error } = await admin.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(rowToListItem);
}

export async function listUserIds() {
  const admin = adminClient();
  const { data, error } = await admin.from(TABLE).select('id');
  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.id as string);
}

export async function getUserById(id: string) {
  const admin = adminClient();
  const { data, error } = await admin.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as ProfileRow) : null;
}

/** Só utilizadores com perfil AAMIHE podem usar este site. */
export async function requireAamiheProfile(userId: string) {
  const profile = await getUserById(userId);
  if (!profile) {
    throw new Error('Esta conta não tem acesso ao AAMIHE. Registe-se ou contacte a administração.');
  }
  return profile;
}

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

async function fetchProfiles(
  admin: ReturnType<typeof adminClient>,
  apply: (query: ReturnType<ReturnType<typeof adminClient>['from']>) => PromiseLike<{
    data: ProfileRow[] | null;
    error: { message: string } | null;
  }>,
): Promise<ProfileRow[]> {
  const { data, error } = await apply(admin.from(TABLE));
  if (error) {
    console.error('[findUserByLogin]:', error.message);
    throw new Error('Não foi possível validar as credenciais. Tente novamente em instantes.');
  }
  return (data || []) as ProfileRow[];
}

function pickUnique(rows: ProfileRow[]): ProfileRow | undefined {
  return rows.length === 1 ? rows[0] : undefined;
}

function matchDisplayOrFullName(rows: ProfileRow[], value: string): ProfileRow | undefined {
  const displayMatches = rows.filter((row) => getDisplayName(row).toLowerCase() === value);
  if (displayMatches.length === 1) return displayMatches[0];

  const fullNameMatches = rows.filter((row) => {
    const combined = `${row.first_name} ${row.last_name}`.trim().toLowerCase();
    return combined === value;
  });
  if (fullNameMatches.length === 1) return fullNameMatches[0];

  return undefined;
}

export async function findUserByLogin(login: string): Promise<ProfileRow | undefined> {
  const value = login.trim().toLowerCase();
  if (!value) return undefined;

  const admin = adminClient();
  const partial = `%${escapeIlike(value)}%`;

  const exactQueries = await Promise.all([
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('email', value).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('username', value).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('alcunha', value).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('first_name', value).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('last_name', value).limit(2)),
  ]);

  for (const rows of exactQueries) {
    const match = pickUnique(rows);
    if (match) return match;
  }

  const nameParts = value.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 2) {
    const first = nameParts[0];
    const last = nameParts.slice(1).join(' ');
    const byFullName = await fetchProfiles(admin, (q) =>
      q.select(PROFILE_SELECT).ilike('first_name', first).ilike('last_name', last).limit(2),
    );
    const fullMatch = pickUnique(byFullName);
    if (fullMatch) return fullMatch;
  }

  const partialQueries = await Promise.all([
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('username', partial).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('alcunha', partial).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('first_name', partial).limit(2)),
    fetchProfiles(admin, (q) => q.select(PROFILE_SELECT).ilike('last_name', partial).limit(2)),
  ]);

  for (const rows of partialQueries) {
    const match = pickUnique(rows);
    if (match) return match;
  }

  const candidateRows = await fetchProfiles(admin, (q) =>
    q
      .select(PROFILE_SELECT)
      .or(
        [
          `username.ilike.${partial}`,
          `alcunha.ilike.${partial}`,
          `first_name.ilike.${partial}`,
          `last_name.ilike.${partial}`,
        ].join(','),
      )
      .limit(24),
  );

  return matchDisplayOrFullName(candidateRows, value);
}

export async function verifyUserPassword(userId: string, password: string) {
  const admin = adminClient();
  const { data: profile, error } = await admin.from(TABLE).select('email').eq('id', userId).maybeSingle();
  if (error || !profile?.email) return false;

  const { error: signInError } = await admin.auth.signInWithPassword({
    email: profile.email,
    password,
  });
  return !signInError;
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
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();

  if (!username || !email || !input.password) {
    throw new Error('Campos obrigatórios em falta.');
  }

  const existing = await findUserByLogin(email);
  if (existing) throw new Error('Este email já está registado.');

  const existingUsername = await findUserByLogin(username);
  if (existingUsername) throw new Error('Este nome de utilizador já existe.');

  const admin = adminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username,
      site: 'aamihe',
      full_name: `${input.firstName || ''} ${input.lastName || ''}`.trim() || username,
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || 'Não foi possível criar a conta.');
  }

  const { error: profileError } = await admin.from(TABLE).insert({
    id: authData.user.id,
    username,
    email,
    first_name: input.firstName || '',
    last_name: input.lastName || '',
    alcunha: input.alcunha || '',
    display_name_type: input.displayNameType || 'full_name',
    role: normalizeRole(input.role),
    bio: input.bio || '',
    website: input.website || '',
    avatar_url: input.avatarUrl || '',
    telefone: input.telefone || '',
    profissao: input.profissao || '',
    cargo: input.cargo || '',
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw new Error(profileError.message);
  }

  const profile = await getUserById(authData.user.id);
  if (!profile) throw new Error('Perfil não criado.');
  return profile;
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
  const admin = adminClient();
  const { data: current, error: readError } = await admin.from(TABLE).select('*').eq('id', input.id).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!current) throw new Error('Utilizador não encontrado.');

  const row = current as ProfileRow;
  const email = (input.email?.trim() || row.email).toLowerCase();
  const nextRole = row.role === 'Administrador' ? row.role : normalizeRole(input.role || row.role);

  if (email !== row.email) {
    const duplicate = await findUserByLogin(email);
    if (duplicate && duplicate.id !== input.id) {
      throw new Error('Este email já está registado.');
    }
  }

  const { error: updateError } = await admin
    .from(TABLE)
    .update({
      email,
      first_name: input.firstName ?? row.first_name,
      last_name: input.lastName ?? row.last_name,
      alcunha: input.alcunha ?? row.alcunha,
      display_name_type: input.displayNameType ?? row.display_name_type,
      role: nextRole,
      website: input.website ?? row.website,
      bio: input.bio ?? row.bio,
      telefone: input.telefone ?? row.telefone,
      profissao: input.profissao ?? row.profissao,
      cargo: input.cargo ?? row.cargo,
      avatar_url: input.avatarUrl ?? row.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (updateError) throw new Error(updateError.message);

  if (input.password) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(input.id, {
      password: input.password,
    });
    if (passwordError) throw new Error(passwordError.message);
  }

  if (email !== row.email) {
    await admin.auth.admin.updateUserById(input.id, { email });
  }

  const profile = await getUserById(input.id);
  if (!profile) throw new Error('Utilizador não encontrado.');
  return profile;
}

export async function deleteUser(id: string) {
  const admin = adminClient();
  const { data: user, error } = await admin.from(TABLE).select('role').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!user) throw new Error('Utilizador não encontrado.');

  if (user.role === 'Administrador') {
    const { count } = await admin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('role', 'Administrador');
    if ((count || 0) <= 1) {
      throw new Error('Não é possível eliminar o último administrador.');
    }
  }

  const { error: deleteProfileError } = await admin.from(TABLE).delete().eq('id', id);
  if (deleteProfileError) throw new Error(deleteProfileError.message);

  await admin.auth.admin.deleteUser(id);
}

export async function deleteUsers(ids: string[]) {
  for (const id of ids) {
    await deleteUser(id);
  }
}

/** @deprecated passwords are managed by Supabase Auth */
export function verifyPassword() {
  return false;
}
