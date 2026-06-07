import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeGoogleAnalyticsCode,
  fetchGoogleAccountEmail,
  findPropertyIdByMeasurementId,
  GA_OAUTH_STATE_COOKIE,
} from '@/lib/google-analytics';
import { loadSiteSettings, saveSiteSettings } from '@/lib/supabase-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');
  const redirectBase = new URL('/dashboard/estatisticas', request.url);

  if (oauthError) {
    redirectBase.searchParams.set('ga_error', oauthError);
    return NextResponse.redirect(redirectBase);
  }

  if (!code || !state) {
    redirectBase.searchParams.set('ga_error', 'missing_code');
    return NextResponse.redirect(redirectBase);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(GA_OAUTH_STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    redirectBase.searchParams.set('ga_error', 'invalid_state');
    return NextResponse.redirect(redirectBase);
  }

  const exchanged = await exchangeGoogleAnalyticsCode(code, request);
  if (!exchanged.accessToken || !exchanged.refreshToken) {
    redirectBase.searchParams.set('ga_error', exchanged.error || 'token_error');
    return NextResponse.redirect(redirectBase);
  }

  const measurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-JJJZM7P441';
  const propertyId =
    process.env.GA4_PROPERTY_ID?.trim() ||
    (await findPropertyIdByMeasurementId(exchanged.accessToken, measurementId));
  const connectedEmail = await fetchGoogleAccountEmail(exchanged.accessToken);

  const existing = (await loadSiteSettings()) ?? {};
  const ok = await saveSiteSettings({
    ...existing,
    googleAnalyticsId: existing.googleAnalyticsId || measurementId,
    googleAnalytics: {
      refreshToken: exchanged.refreshToken,
      propertyId: propertyId ?? existing.googleAnalytics?.propertyId,
      connectedEmail: connectedEmail ?? undefined,
      connectedAt: new Date().toISOString(),
    },
  });

  if (!ok) {
    redirectBase.searchParams.set('ga_error', 'save_failed');
    const failResponse = NextResponse.redirect(redirectBase);
    failResponse.cookies.delete(GA_OAUTH_STATE_COOKIE);
    return failResponse;
  }

  if (!propertyId) {
    redirectBase.searchParams.set('ga_warning', 'property_not_found');
  } else {
    redirectBase.searchParams.set('ga_connected', '1');
  }

  const response = NextResponse.redirect(redirectBase);
  response.cookies.delete(GA_OAUTH_STATE_COOKIE);
  return response;
}
