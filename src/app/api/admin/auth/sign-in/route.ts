import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
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

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado.' }, { status: 500 });
    }

    const { data, error } = await admin.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { success: false, error: 'Nome, email ou utilizador, ou senha incorrectos.' },
        { status: 401 },
      );
    }

    const user = await getUserById(data.user.id);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Esta conta não está registada no AAMIHE. Registe-se ou utilize uma conta criada para este site.',
        },
        { status: 403 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (sessionError) {
      console.error('[sign-in] setSession:', sessionError.message);
      return NextResponse.json(
        { success: false, error: 'Sessão criada mas cookies não guardados. Tente novamente.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      username: user.username || login,
      user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
