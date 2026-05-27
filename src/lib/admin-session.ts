import { createHmac, timingSafeEqual } from 'node:crypto';
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

async function readAllUsers() {
  try {
    const raw = await readFile(path.join(process.cwd(), 'aamihe_users.json'), 'utf8');
    const db = JSON.parse(raw);
    return db.users || [];
  } catch {
    return [];
  }
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.replace(/^Bearer\s+/i, '').trim();
}

export async function requireAdminAuth(request: Request) {
  const token = extractBearerToken(request);
  if (!token) {
    return { error: 'Acesso não autorizado.', status: 401 };
  }

  const adminSecret = process.env.AAMIHE_ADMIN_SECRET || '';
  if (adminSecret && token === adminSecret) {
    return null;
  }

  const users = await readAllUsers();
  for (const user of users) {
    if (isUserSessionToken(token, user.id)) {
      return null;
    }
  }

  return { error: 'Acesso não autorizado.', status: 401 };
}
