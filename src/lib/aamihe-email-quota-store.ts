import 'server-only';

import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const LEGACY_TABLE = 'aamihe_email_daily_log';
const QUOTA_SLUG = 'aamihe_email_quota';

type QuotaPayload = {
  days: Record<string, number>;
};

function admin() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase não configurado (SUPABASE_SERVICE_ROLE_KEY).');
  }
  return client;
}

function isMissingTableError(message: string): boolean {
  return message.includes('aamihe_email_daily_log') || message.includes('PGRST205');
}

async function readFromLegacyTable(): Promise<Record<string, number>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const { data, error } = await admin()
    .from(LEGACY_TABLE)
    .select('date_key, send_count')
    .gte('date_key', cutoffKey);

  if (error) {
    if (isMissingTableError(error.message)) return {};
    console.error('[aamihe_email_daily_log] read:', error.message);
    return {};
  }

  const days: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = String(row.date_key).slice(0, 10);
    days[key] = Number(row.send_count) || 0;
  }
  return days;
}

async function readFromSiteContent(): Promise<Record<string, number>> {
  const { data, error } = await admin()
    .from('site_content')
    .select('news')
    .eq('site_slug', QUOTA_SLUG)
    .maybeSingle();

  if (error) {
    console.error('[aamihe_email_quota] read:', error.message);
    return {};
  }

  const raw = data?.news;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'days' in raw) {
    const days = (raw as QuotaPayload).days;
    if (days && typeof days === 'object') return days;
  }

  return {};
}

export async function readEmailSendDays(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};

  const [fromContent, fromLegacy] = await Promise.all([readFromSiteContent(), readFromLegacyTable()]);
  if (Object.keys(fromContent).length > 0) return fromContent;
  return fromLegacy;
}

async function writeToSiteContent(days: Record<string, number>): Promise<void> {
  const { error } = await admin().from('site_content').upsert(
    {
      site_slug: QUOTA_SLUG,
      news: { days } satisfies QuotaPayload,
      categories: [],
      documents: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_slug' },
  );

  if (error) {
    console.error('[aamihe_email_quota] write:', error.message);
    throw new Error('Não foi possível guardar a quota de e-mail.');
  }
}

async function writeToLegacyTable(days: Record<string, number>): Promise<boolean> {
  const now = new Date().toISOString();
  const rows = Object.entries(days).map(([date_key, send_count]) => ({
    date_key,
    send_count,
    updated_at: now,
  }));

  if (rows.length === 0) return true;

  const { error } = await admin().from(LEGACY_TABLE).upsert(rows, { onConflict: 'date_key' });
  if (error) {
    if (isMissingTableError(error.message)) return false;
    console.error('[aamihe_email_daily_log] write:', error.message);
    return false;
  }

  return true;
}

export async function writeEmailSendDays(days: Record<string, number>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (Object.keys(days).length === 0) return;

  await writeToSiteContent(days);
  await writeToLegacyTable(days);
}

export async function importEmailSendDays(days: Record<string, number>): Promise<void> {
  await writeEmailSendDays(days);
}
