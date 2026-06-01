import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { LOGIN_PATH } from '@/lib/login-path';
import { safeErrorMessage } from '@/lib/safe-error-message';
import { findUserByLogin } from '@/lib/users';

export const dynamic = 'force-dynamic';

const NO_ACCESS_MSG =
  'Esta conta não está registada no AAMIHE. Registe-se ou utilize email e senha de uma conta AAMIHE.';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    const loginUrl = new URL(LOGIN_PATH, requestUrl.origin);
    loginUrl.searchParams.set('error', error);
    loginUrl.searchParams.set(
      'error_description',
      safeErrorMessage(errorDescription, 'Erro ao autenticar com Google'),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL(LOGIN_PATH, requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    const loginUrl = new URL(LOGIN_PATH, requestUrl.origin);
    loginUrl.searchParams.set('error', 'callback_error');
    loginUrl.searchParams.set(
      'error_description',
      safeErrorMessage(exchangeError?.message, 'Erro ao confirmar sessão. Tente novamente.'),
    );
    return NextResponse.redirect(loginUrl);
  }

  const profile = await findUserByLogin(data.user.email || '');
  if (!profile) {
    await supabase.auth.signOut();
    const loginUrl = new URL(LOGIN_PATH, requestUrl.origin);
    loginUrl.searchParams.set('error', 'no_aamihe_access');
    loginUrl.searchParams.set('error_description', NO_ACCESS_MSG);
    return NextResponse.redirect(loginUrl);
  }

  const isStaff = profile.role !== 'Subscritor';
  const redirectPath = isStaff ? '/admin/dashboard' : '/dashboard';
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
