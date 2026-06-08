import type { UserListItem, UserProfile, UserRole } from '@/lib/user-types';
import { canManageUsers } from '@/lib/admin-permissions';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const TABLE = 'aamihe_user_profiles';

type ProfileRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  alcunha: string;
  display_name_type: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
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
    avatar: resolveAvatarUrl(row.avatar_url),
    isAdmin: row.role === 'Administrador',
  };
}

export function canViewStaffUsers(viewer: Pick<UserProfile, 'role' | 'isAdmin'>): boolean {
  return viewer.role === 'Administrador' || Boolean(viewer.isAdmin);
}

export function canListUsers(
  viewer: Pick<UserProfile, 'role' | 'isAdmin'>,
  scope: UserListScope = 'staff',
): boolean {
  if (viewer.role === 'Actor' || viewer.role === 'Contribuidor') return false;
  if (scope === 'subscribers') {
    return viewer.role === 'Subscritor' || canManageUsers(viewer.role) || Boolean(viewer.isAdmin);
  }
  return canManageUsers(viewer.role) || Boolean(viewer.isAdmin);
}

export type UserListScope = 'staff' | 'subscribers';

const SUBSCRIBER_ROLE: UserRole = 'Subscritor';

async function queryProfilesForViewer(
  viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>,
  scope: UserListScope,
) {
  const admin = adminClient();

  if (viewer.role === 'Subscritor') {
    if (scope === 'subscribers') {
      const { data, error } = await admin.from(TABLE).select('*').eq('id', viewer.id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? [rowToListItem(data as ProfileRow)] : [];
    }
    const { data, error } = await admin.from(TABLE).select('*').eq('id', viewer.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? [rowToListItem(data as ProfileRow)] : [];
  }

  if (viewer.role === 'Actor') {
    return [];
  }

  if (scope === 'subscribers') {
    const { data, error } = await admin
      .from(TABLE)
      .select('*')
      .eq('role', SUBSCRIBER_ROLE)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ProfileRow[]).map(rowToListItem);
  }

  // scope === 'staff' — utilizadores principais (sem subscritores)
  if (viewer.role === 'Editor' && !canViewStaffUsers(viewer)) {
    const { data: selfRow, error: selfError } = await admin
      .from(TABLE)
      .select('*')
      .eq('id', viewer.id)
      .maybeSingle();
    if (selfError) throw new Error(selfError.message);

    const { data: contribuidores, error: contribError } = await admin
      .from(TABLE)
      .select('*')
      .eq('role', 'Contribuidor')
      .order('created_at', { ascending: false });
    if (contribError) throw new Error(contribError.message);

    const items: UserListItem[] = [];
    if (selfRow) items.push(rowToListItem(selfRow as ProfileRow));
    for (const row of (contribuidores as ProfileRow[]) || []) {
      if (row.id !== viewer.id) items.push(rowToListItem(row));
    }
    return items;
  }

  const { data, error } = await admin
    .from(TABLE)
    .select('*')
    .neq('role', SUBSCRIBER_ROLE)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(rowToListItem);
}

export async function listUsersForViewer(
  viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>,
  scope: UserListScope = 'staff',
) {
  if (!canListUsers(viewer, scope)) {
    return [];
  }
  return queryProfilesForViewer(viewer, scope);
}

export async function listSubscribersForViewer(viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>) {
  return listUsersForViewer(viewer, 'subscribers');
}

export async function countUsersForViewer(
  viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>,
  scope: UserListScope = 'staff',
) {
  if (!canListUsers(viewer, scope)) return 0;

  const admin = adminClient();

  if (viewer.role === 'Subscritor') {
    return scope === 'subscribers' || scope === 'staff' ? 1 : 0;
  }

  if (viewer.role === 'Actor') {
    return 0;
  }

  if (scope === 'subscribers') {
    const { count, error } = await admin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('role', SUBSCRIBER_ROLE);
    if (error) throw new Error(error.message);
    return count || 0;
  }

  if (viewer.role === 'Editor' && !canViewStaffUsers(viewer)) {
    const { count: contribCount, error: contribError } = await admin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('role', 'Contribuidor');
    if (contribError) throw new Error(contribError.message);
    return (contribCount || 0) + 1;
  }

  const { count, error } = await admin
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .neq('role', SUBSCRIBER_ROLE);
  if (error) throw new Error(error.message);
  return count || 0;
}
