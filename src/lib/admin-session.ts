import { createHmac, timingSafeEqual } from 'node:crypto';
import { getUserById, listUserIds } from '@/lib/users';
import type { UserProfile } from '@/lib/user-types';
import { isSubscriberRole } from '@/lib/user-types';

function getSessionSecret() {
  return process.env.AAMIHE_ADMIN_SECRET || 'aamihe-session';
}

function signUserSession(userId: string) {
  return createHmac('sha256', getSessionSecret()).update(`user:${userId}`).digest('hex');
}

export function createUserSessionToken(userId: string) {
  return `${userId}.${signUserSession(userId)}`;
}

export function isUserSessionToken(token: string, userId: string) {
  const expected = signUserSession(userId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
}

export type SessionUser = { type: 'admin' } | { type: 'user'; user: UserProfile };

async function resolveUserFromToken(token: string): Promise<UserProfile | null> {
  const dot = token.indexOf('.');
  if (dot > 0) {
    const userId = token.slice(0, dot);
    const signature = token.slice(dot + 1);
    if (userId && signature && isUserSessionToken(signature, userId)) {
      return (await getUserById(userId)) ?? null;
    }
  }

  const userIds = await listUserIds();
  for (const userId of userIds) {
    if (isUserSessionToken(token, userId)) {
      return (await getUserById(userId)) ?? null;
    }
  }

  return null;
}

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const adminSecret = process.env.AAMIHE_ADMIN_SECRET || '';
  if (adminSecret && token === adminSecret) {
    return { type: 'admin' };
  }

  const user = await resolveUserFromToken(token);
  return user ? { type: 'user', user } : null;
}

export function isStaffSession(session: SessionUser | null): session is SessionUser {
  if (!session) return false;
  if (session.type === 'admin') return true;
  if (session.type === 'user') {
    if (session.user.isAdmin) return true;
    if (!isSubscriberRole(session.user.role)) return true;
  }
  return false;
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
  if (session.type === 'admin') {
    return session;
  }
  if (session.type === 'user' && session.user.isAdmin) {
    return session;
  }
  return { error: 'Acesso não autorizado.', status: 403 } as const;
}

export async function requireSessionUser(request: Request) {
  const session = await resolveSessionUser(request);
  if (!session || session.type !== 'user') {
    return { error: 'Acesso não autorizado.', status: 401 };
  }
  return session;
}
