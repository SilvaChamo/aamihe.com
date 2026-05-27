import { NextRequest, NextResponse } from 'next/server';
import { updateUser, USER_ROLES, type UserRole } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      email,
      firstName,
      lastName,
      alcunha,
      displayNameType,
      role,
      bio,
      website,
      avatarUrl,
      password,
      telefone,
      profissao,
      cargo,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    const safeRole: UserRole | undefined =
      role && USER_ROLES.includes(role) ? role : undefined;

    const user = await updateUser({
      id,
      email,
      firstName,
      lastName,
      alcunha,
      displayNameType,
      role: safeRole,
      bio,
      website,
      avatarUrl,
      password,
      telefone,
      profissao,
      cargo,
    });

    return NextResponse.json({ success: true, user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar utilizador';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
