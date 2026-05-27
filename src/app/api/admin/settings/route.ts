import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-session';
import { loadSiteSettings, saveSiteSettings } from '@/lib/supabase-settings';

export async function GET(request: Request) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const settings = await loadSiteSettings();
  return NextResponse.json({ success: true, settings: settings ?? {} });
}

export async function POST(request: Request) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  // Merge with existing settings
  const existing = (await loadSiteSettings()) ?? {};
  const merged = { ...existing, ...body };

  const ok = await saveSiteSettings(merged);
  if (!ok) {
    // If Supabase not configured, return success anyway (local dev fallback)
    return NextResponse.json({ success: true, settings: merged, note: 'Supabase not configured, settings not persisted.' });
  }

  return NextResponse.json({ success: true, settings: merged });
}
