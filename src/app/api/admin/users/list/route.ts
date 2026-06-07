import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { canListUsers, listUsersForViewer, type UserListScope } from '@/lib/users-viewer';

export const dynamic = 'force-dynamic';

function parseScope(raw: string | null): UserListScope {
  return raw === 'subscribers' ? 'subscribers' : 'staff';
}

export async function GET(request: Request) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const viewer = auth.session.user;
    if (!canListUsers(viewer)) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    const scope = parseScope(new URL(request.url).searchParams.get('scope'));
    const users = await listUsersForViewer(viewer, scope);
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar utilizadores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
