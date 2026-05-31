import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionUser } from '@/lib/admin-session';
import { getUserById, updateUser, verifyUserPassword } from '@/lib/users';

export async function GET(req: NextRequest) {
  try {
    const session = await resolveSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    return NextResponse.json({
      isAdminSecret: false,
      user: { ...session.user, articles: 0 },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao carregar perfil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await resolveSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      telefone,
      profissao,
      bio,
      website,
      avatarUrl,
      alcunha,
      displayNameType,
      currentPassword,
      newPassword,
    } = body;

    if (newPassword) {
      const currentOk = await verifyUserPassword(session.user.id, String(currentPassword || ''));
      if (!currentOk) {
        return NextResponse.json({ error: 'Senha actual incorrecta.' }, { status: 400 });
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: 'A nova senha deve ter pelo menos 6 caracteres.' },
          { status: 400 },
        );
      }
    }

    const user = await updateUser({
      id: session.user.id,
      firstName: firstName !== undefined ? String(firstName) : undefined,
      lastName: lastName !== undefined ? String(lastName) : undefined,
      email: email !== undefined ? String(email) : undefined,
      telefone: telefone !== undefined ? String(telefone) : undefined,
      profissao: profissao !== undefined ? String(profissao) : undefined,
      bio: bio !== undefined ? String(bio) : undefined,
      website: website !== undefined ? String(website) : undefined,
      alcunha: alcunha !== undefined ? String(alcunha) : undefined,
      displayNameType: displayNameType !== undefined ? String(displayNameType) : undefined,
      avatarUrl: avatarUrl !== undefined ? String(avatarUrl) : undefined,
      password: newPassword ? String(newPassword) : undefined,
    });

    return NextResponse.json({ success: true, user: { ...user, articles: 0 } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao actualizar perfil';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
