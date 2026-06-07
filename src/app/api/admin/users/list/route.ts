import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { canListUsers, listUsersForViewer } from '@/lib/users-viewer';

export const dynamic = 'force-dynamic';

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

    const users = await listUsersForViewer(viewer);
    return NextResponse.json({ users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar utilizadores';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
