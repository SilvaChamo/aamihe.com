import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { canViewStaffUsers, getUserById } from '@/lib/users';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const viewer = auth.session.user;
    const isStaffAccount = user.role === 'Administrador' || user.role === 'Editor' || user.role === 'Actor';

    if (!canViewStaffUsers(viewer) && isStaffAccount && viewer.id !== user.id) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });
    }

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar utilizador';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
