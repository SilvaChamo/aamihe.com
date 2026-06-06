import { NextResponse } from 'next/server';
import { buildGoogleAuthUrl } from '@/lib/google-oauth';
import { LOGIN_PATH } from '@/lib/login-path';
import { safeErrorMessage } from '@/lib/safe-error-message';

import { GOOGLE_OAUTH_STATE_COOKIE } from '@/lib/google-oauth-state';

export const dynamic = 'force-dynamic';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
  return raw;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const next = safeNextPath(searchParams.get('next'));
    const state = crypto.randomUUID();

    const response = NextResponse.redirect(buildGoogleAuthUrl(request, state));
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, JSON.stringify({ state, next }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    return response;
  } catch (err) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('error', 'google_oauth_config');
    loginUrl.searchParams.set(
      'error_description',
      safeErrorMessage(err instanceof Error ? err.message : '', 'Google OAuth indisponível.'),
    );
    return NextResponse.redirect(loginUrl);
  }
}
