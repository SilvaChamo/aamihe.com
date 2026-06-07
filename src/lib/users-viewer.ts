import type { UserListItem, UserProfile, UserRole } from '@/lib/user-types';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const TABLE = 'aamihe_user_profiles';

const STAFF_ROLES: UserRole[] = ['Administrador', 'Editor', 'Actor'];

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

export function canListUsers(viewer: Pick<UserProfile, 'role' | 'isAdmin'>): boolean {
  if (viewer.role === 'Actor') return false;
  if (viewer.role === 'Subscritor') return false;
  return canViewStaffUsers(viewer) || viewer.role === 'Editor';
}

async function queryProfilesForViewer(viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>) {
  const admin = adminClient();

  if (viewer.role === 'Subscritor') {
    const { data, error } = await admin.from(TABLE).select('*').eq('id', viewer.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? [rowToListItem(data as ProfileRow)] : [];
  }

  if (viewer.role === 'Actor') {
    return [];
  }

  if (viewer.role === 'Editor' && !canViewStaffUsers(viewer)) {
    const { data, error } = await admin
      .from(TABLE)
      .select('*')
      .in('role', ['Subscritor', 'Contribuidor'])
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ProfileRow[]).map(rowToListItem);
  }

  const { data, error } = await admin.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ProfileRow[]).map(rowToListItem);
}

export async function listUsersForViewer(viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>) {
  if (!canListUsers(viewer)) {
    return [];
  }
  return queryProfilesForViewer(viewer);
}

export async function countUsersForViewer(viewer: Pick<UserProfile, 'id' | 'role' | 'isAdmin'>) {
  if (!canListUsers(viewer)) return 0;

  const admin = adminClient();

  if (viewer.role === 'Subscritor') {
    return 1;
  }

  if (viewer.role === 'Actor') {
    return 0;
  }

  if (viewer.role === 'Editor' && !canViewStaffUsers(viewer)) {
    const { count, error } = await admin
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .in('role', ['Subscritor', 'Contribuidor']);
    if (error) throw new Error(error.message);
    return count || 0;
  }

  const { count, error } = await admin.from(TABLE).select('id', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return count || 0;
}
