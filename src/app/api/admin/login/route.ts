import { NextResponse } from 'next/server';
import { findUserByLogin, verifyPassword } from '@/lib/users';
import { createUserSessionToken } from '@/lib/admin-session';

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
        { success: false, error: 'Nome de utilizador e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    // Check registered user in JSON database
    const registeredUser = await findUserByLogin(username);
    if (registeredUser && verifyPassword(password, registeredUser)) {
      return NextResponse.json({
        success: true,
        token: createUserSessionToken(registeredUser.id),
        username: registeredUser.username,
      });
    }

    // Fallback: master admin secret via environment variable
    const adminSecret = process.env.AAMIHE_ADMIN_SECRET || '';
    if (adminSecret && password === adminSecret) {
      return NextResponse.json({
        success: true,
        token: adminSecret,
        username,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Nome de utilizador ou senha incorrectos.' },
      { status: 401 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
