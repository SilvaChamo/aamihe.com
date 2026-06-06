import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeGoogleCode } from '@/lib/google-oauth';
import { clearStaleSupabaseAuthCookiesFromRequest } from '@/lib/supabase-auth-cookies';
import { GOOGLE_OAUTH_STATE_COOKIE } from '@/lib/google-oauth-state';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { findUserByLogin } from '@/lib/users';
import { LOGIN_PATH } from '@/lib/login-path';
import { safeErrorMessage } from '@/lib/safe-error-message';

export const dynamic = 'force-dynamic';

const NO_ACCESS_MSG =
  'Esta conta não está registada no AAMIHE. Registe-se ou utilize email e senha de uma conta AAMIHE.';

function loginRedirect(request: Request, error: string, description: string) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set('error', error);
  loginUrl.searchParams.set('error_description', description);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const oauthDescription = searchParams.get('error_description');

  if (oauthError) {
    return loginRedirect(
      request,
      oauthError,
      safeErrorMessage(oauthDescription, 'Erro ao autenticar com Google.'),
    );
  }

  if (!code || !state) {
    return loginRedirect(request, 'google_callback', 'Resposta Google incompleta.');
  }

  const cookieStore = await cookies();
  const rawState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  let nextPath = '/dashboard';
  try {
    const parsed = JSON.parse(rawState || '{}') as { state?: string; next?: string };
    if (!parsed.state || parsed.state !== state) {
      return loginRedirect(request, 'google_state', 'Sessão Google expirada. Tente novamente.');
    }
    if (parsed.next?.startsWith('/') && !parsed.next.startsWith('//')) {
      nextPath = parsed.next;
    }
  } catch {
    return loginRedirect(request, 'google_state', 'Sessão Google inválida. Tente novamente.');
  }

  const tokens = await exchangeGoogleCode(code, request);
  if (!tokens.id_token) {
    return loginRedirect(
      request,
      'google_token',
      safeErrorMessage(tokens.error, 'Não foi possível validar a conta Google.'),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.id_token,
  });

  if (signInError || !data.user) {
    return loginRedirect(
      request,
      'google_supabase',
      safeErrorMessage(signInError?.message, 'Erro ao criar sessão AAMIHE.'),
    );
  }

  const profile = await findUserByLogin(data.user.email || '');
  if (!profile) {
    await supabase.auth.signOut();
    return loginRedirect(request, 'no_aamihe_access', NO_ACCESS_MSG);
  }

  const defaultTarget = '/dashboard';
  const target =
    nextPath.startsWith('/admin') || nextPath === '/dashboard/login' ? defaultTarget : nextPath;

  const response = NextResponse.redirect(new URL(target, request.url));
  clearStaleSupabaseAuthCookiesFromRequest(
    (await cookies()).getAll(),
    response,
  );
  response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return response;
}
