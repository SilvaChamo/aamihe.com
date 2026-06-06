import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { LOGIN_PATH } from '@/lib/login-path';
import { isSupabaseAuthCookieName } from '@/lib/supabase-auth-cookies';

/** Limpa todos os cookies de sessão Supabase (útil após HTTP 431). */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));

  for (const cookie of cookieStore.getAll()) {
    if (isSupabaseAuthCookieName(cookie.name)) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
