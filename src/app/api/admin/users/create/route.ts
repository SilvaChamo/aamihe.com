import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionUser } from '@/lib/admin-session';
import { createUser, USER_ROLES, type UserRole } from '@/lib/users';
import { isSubscriberRole } from '@/lib/user-types';

export async function POST(req: NextRequest) {
  try {
    const session = await resolveSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }
    if (session.type === 'user' && isSubscriberRole(session.user.role)) {
      return NextResponse.json(
        { error: 'Subscritores não podem criar contas no sistema.' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      alcunha,
      displayNameType,
      role,
      website,
      avatarUrl,
      telefone,
      profissao,
      cargo,
      bio,
    } = body;

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });
    }

    const safeRole: UserRole = USER_ROLES.includes(role) ? role : 'Subscritor';

    const user = await createUser({
      username,
      email,
      password,
      firstName,
      lastName,
      alcunha,
      displayNameType,
      role: safeRole,
      website,
      avatarUrl,
      telefone,
      profissao,
      cargo,
      bio,
    });

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar utilizador';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
