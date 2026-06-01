import type { UserProfile } from '@/lib/user-types';
import { isSubscriberRole } from '@/lib/user-types';
import { getUserById } from '@/lib/users';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export function extractBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
}

export type SessionUser = { type: 'user'; user: UserProfile };

async function resolveUserFromAccessToken(token: string): Promise<UserProfile | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const profile = await getUserById(data.user.id);
  return profile;
}

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  const bearer = extractBearerToken(request);
  if (bearer) {
    const fromToken = await resolveUserFromAccessToken(bearer);
    if (fromToken) return { type: 'user', user: fromToken };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getUserById(user.id);
  return profile ? { type: 'user', user: profile } : null;
}

export function isStaffSession(session: SessionUser | null): session is SessionUser {
  if (!session) return false;
  if (session.user.isAdmin) return true;
  return !isSubscriberRole(session.user.role);
}

export async function requireStaffSession(request: Request) {
  const session = await resolveSessionUser(request);
  if (!session) {
    return { error: 'Acesso não autorizado.', status: 401 as const };
  }
  if (!isStaffSession(session)) {
    return { error: 'Acesso não autorizado.', status: 403 as const };
  }
  return { session };
}

export async function requireAdminAuth(request: Request) {
  const session = await resolveSessionUser(request);
  if (!session) {
    return { error: 'Acesso não autorizado.', status: 401 };
  }
  return null;
}

export async function requireAdminRole(request: Request) {
  const session = await resolveSessionUser(request);
  if (!session) {
    return { error: 'Acesso não autorizado.', status: 401 } as const;
  }
  if (session.user.isAdmin) {
    return session;
  }
  return { error: 'Acesso não autorizado.', status: 403 } as const;
}

export async function requireSessionUser(request: Request) {
  const session = await resolveSessionUser(request);
  if (!session) {
    return { error: 'Acesso não autorizado.', status: 401 };
  }
  return session;
}
