import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ensureProfileFromAuthUser, findUserByLogin } from '@/lib/users';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    const loginUrl = new URL('/admin/login', requestUrl.origin);
    loginUrl.searchParams.set('error', error);
    loginUrl.searchParams.set('error_description', errorDescription || 'Erro ao autenticar com Google');
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin/login', requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    const loginUrl = new URL('/admin/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'callback_error');
    loginUrl.searchParams.set('error_description', exchangeError?.message || 'Erro desconhecido');
    return NextResponse.redirect(loginUrl);
  }

  await ensureProfileFromAuthUser(data.user);

  const profile = await findUserByLogin(data.user.email || '');
  const isStaff =
    profile &&
    profile.role !== 'Subscritor';

  const redirectPath = isStaff ? '/dashboard' : '/dashboard/minha-conta';
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
