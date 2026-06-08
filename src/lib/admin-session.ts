import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/user-types';
import { isSubscriberRole } from '@/lib/user-types';
import { getUserById } from '@/lib/users';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

function resolveSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
}

export type SessionUser = { type: 'user'; user: UserProfile };

async function resolveUserFromAccessToken(token: string): Promise<UserProfile | null> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) {
      return getUserById(data.user.id);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = resolveSupabaseAnonKey();
  if (!url || !anonKey) return null;

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;

  return getUserById(data.user.id);
}

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  const bearer = extractBearerToken(request);
  if (bearer) {
    const fromToken = await resolveUserFromAccessToken(bearer);
    if (fromToken) return { type: 'user', user: fromToken };
  }

  const supabase = await createSupabaseServerClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    user = refreshed.session?.user ?? null;
  }

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
