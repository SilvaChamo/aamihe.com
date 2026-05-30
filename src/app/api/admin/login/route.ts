import { NextResponse } from 'next/server';
import { findUserByLogin, mapUserToProfile, verifyPassword } from '@/lib/users';
import { createUserSessionToken } from '@/lib/admin-session';

function loginSuccess(registeredUser: Awaited<ReturnType<typeof findUserByLogin>> & object) {
  return NextResponse.json({
    success: true,
    token: createUserSessionToken(registeredUser.id),
    username: registeredUser.username,
    user: mapUserToProfile(registeredUser),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const honeypot = String(body.honeypot || '').trim();

    if (honeypot) {
      return NextResponse.json({ success: false, error: 'Verificação falhou.' }, { status: 400 });
    }

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Nome, email ou utilizador e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    const registeredUser = await findUserByLogin(username);
    if (registeredUser && verifyPassword(password, registeredUser)) {
      return loginSuccess(registeredUser);
    }

    const adminSecret = process.env.AAMIHE_ADMIN_SECRET || '';
    if (adminSecret && password === adminSecret) {
      if (registeredUser) {
        return loginSuccess(registeredUser);
      }

      return NextResponse.json({
        success: true,
        token: adminSecret,
        username,
        user: null,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Nome, email ou utilizador, ou senha incorrectos.' },
      { status: 401 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
