import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { findUserByLogin, getUserById } from '@/lib/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body.login || body.username || body.email || '').trim();
    const password = String(body.password || '');

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

    const user = await getUserById(data.user.id);
    if (!user) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error:
            'Esta conta não está registada no AAMIHE. Registe-se ou utilize uma conta criada para este site.',
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      username: user.username || login,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
