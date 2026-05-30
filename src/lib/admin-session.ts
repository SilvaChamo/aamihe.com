import { createHmac, timingSafeEqual } from 'node:crypto';
import { getUserById } from '@/lib/users';
import type { UserProfile } from '@/lib/user-types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

function getSessionSecret() {
  return process.env.AAMIHE_ADMIN_SECRET || 'aamihe-session';
}

export function createUserSessionToken(userId: string) {
  return createHmac('sha256', getSessionSecret()).update(`user:${userId}`).digest('hex');
}

export function isUserSessionToken(token: string, userId: string) {
  const expected = createUserSessionToken(userId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function readAllUserIds() {
  try {
    const raw = await readFile(path.join(process.cwd(), 'aamihe_users.json'), 'utf8');
    const db = JSON.parse(raw);
    return (db.users || []).map((user: { id: string }) => user.id);
  } catch {
    return [];
  }
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
}

export type SessionUser = { type: 'admin' } | { type: 'user'; user: UserProfile };

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const adminSecret = process.env.AAMIHE_ADMIN_SECRET || '';
  if (adminSecret && token === adminSecret) {
    return { type: 'admin' };
  }

  const userIds = await readAllUserIds();
  for (const userId of userIds) {
    if (isUserSessionToken(token, userId)) {
      const user = await getUserById(userId);
      return user ? { type: 'user', user } : null;
    }
  }

  return null;
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
