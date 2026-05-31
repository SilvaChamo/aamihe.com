import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ensureProfileFromAuthUser, findUserByLogin, getUserById } from '@/lib/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body.login || body.username || body.email || '').trim();
    const password = String(body.password || '');
    const honeypot = String(body.honeypot || '').trim();

    if (honeypot) {
      return NextResponse.json({ success: false, error: 'Verificação falhou.' }, { status: 400 });
    }

    if (!login || !password) {
      return NextResponse.json(
        { success: false, error: 'Nome, email ou utilizador e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    let email = login;
    if (!email.includes('@')) {
      const profile = await findUserByLogin(login);
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Nome, email ou utilizador, ou senha incorrectos.' },
          { status: 401 },
        );
      }
      email = profile.email;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, error: 'Nome, email ou utilizador, ou senha incorrectos.' },
        { status: 401 },
      );
    }

    await ensureProfileFromAuthUser(data.user);
    const user = await getUserById(data.user.id);

    return NextResponse.json({
      success: true,
      username: user?.username || login,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
