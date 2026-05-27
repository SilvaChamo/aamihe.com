import { NextRequest, NextResponse } from 'next/server';
import { createUser, USER_ROLES, type UserRole } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
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
