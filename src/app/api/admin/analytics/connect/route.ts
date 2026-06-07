import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { buildGoogleAnalyticsAuthUrl, GA_OAUTH_STATE_COOKIE } from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireStaffSession(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const state = crypto.randomUUID();
    const response = NextResponse.redirect(buildGoogleAnalyticsAuthUrl(request, state));
    response.cookies.set(GA_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google Analytics indisponível.' },
      { status: 500 },
    );
  }
}
