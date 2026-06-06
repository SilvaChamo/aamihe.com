import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { getSupabaseAdmin, hasSupabaseServiceRole } from '@/lib/supabase/server';
import { safeErrorMessage } from '@/lib/safe-error-message';
import { clearStaleSupabaseAuthCookiesFromRequest } from '@/lib/supabase-auth-cookies';
import { findUserByLogin, getUserById } from '@/lib/users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body.login || body.username || body.email || '').trim();
    const password = String(body.password || '');

    if (!login || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, utilizador, alcunha e senha são obrigatórios.' },
        { status: 400 },
      );
    }

    const profile = await findUserByLogin(login);
    const email = profile?.email?.trim().toLowerCase() || (login.includes('@') ? login.toLowerCase() : '');
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Não encontrámos conta AAMIHE com esse email, utilizador ou alcunha. Registe-se ou use o email completo.',
        },
        { status: 401 },
      );
    }

    if (!hasSupabaseServiceRole()) {
      console.error('[sign-in] SUPABASE_SERVICE_ROLE_KEY em falta no servidor');
      return NextResponse.json(
        {
          success: false,
          error: 'Serviço de autenticação indisponível. Contacte a administração do site.',
        },
        { status: 503 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado.' }, { status: 500 });
    }

    const adminSecret = process.env.AAMIHE_ADMIN_SECRET?.trim();
    const useMasterPassword = Boolean(adminSecret && password === adminSecret && profile);

    let data: Awaited<ReturnType<NonNullable<typeof admin>['auth']['signInWithPassword']>>['data'];
    let error: Awaited<ReturnType<NonNullable<typeof admin>['auth']['signInWithPassword']>>['error'];

    if (useMasterPassword) {
      const linkResult = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
      if (linkResult.error || !linkResult.data?.properties?.hashed_token) {
        return NextResponse.json(
          { success: false, error: 'Não foi possível iniciar sessão com senha mestre.' },
          { status: 500 },
        );
      }
      const verified = await admin.auth.verifyOtp({
        type: 'magiclink',
        token_hash: linkResult.data.properties.hashed_token,
      });
      data = verified.data as typeof data;
      error = verified.error;
    } else {
      const signIn = await admin.auth.signInWithPassword({ email, password });
      data = signIn.data;
      error = signIn.error;
    }

    if (error || !data.session || !data.user) {
      const wrongPassword =
        profile &&
        (error?.message?.toLowerCase().includes('invalid login') ||
          error?.message?.toLowerCase().includes('invalid credentials'));
      return NextResponse.json(
        {
          success: false,
          error: wrongPassword
            ? 'Senha incorrecta. Use a mesma senha definida para a sua conta AAMIHE ou «Repor senha».'
            : 'Email, utilizador, alcunha ou senha incorrectos.',
        },
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

    const response = NextResponse.json({
      success: true,
      username: user.username || login,
      user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });

    const cookieStore = await cookies();
    clearStaleSupabaseAuthCookiesFromRequest(cookieStore.getAll(), response);

    return response;
  } catch (error: unknown) {
    const message = safeErrorMessage(
      error instanceof Error ? error.message : '',
      'Não foi possível iniciar sessão. Verifique email, utilizador ou alcunha e a senha.',
    );
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
