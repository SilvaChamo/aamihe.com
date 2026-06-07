import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { fetchGa4RealtimeSnapshot, isGoogleAnalyticsConfigured } from '@/lib/google-analytics';
import { loadSiteSettings } from '@/lib/supabase-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireStaffSession(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await loadSiteSettings();
  const snapshot = await fetchGa4RealtimeSnapshot(settings);

  return NextResponse.json({
    success: true,
    connected: isGoogleAnalyticsConfigured(settings),
    snapshot,
  });
}
