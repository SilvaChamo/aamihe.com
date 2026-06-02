import 'server-only';

import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const TABLE = 'aamihe_email_daily_log';

function admin() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase não configurado (SUPABASE_SERVICE_ROLE_KEY).');
  }
  return client;
}

export async function readEmailSendDays(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const { data, error } = await admin()
    .from(TABLE)
    .select('date_key, send_count')
    .gte('date_key', cutoffKey);

  if (error) {
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

export async function writeEmailSendDays(days: Record<string, number>): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const now = new Date().toISOString();
  const rows = Object.entries(days).map(([date_key, send_count]) => ({
    date_key,
    send_count,
    updated_at: now,
  }));

  if (rows.length === 0) return;

  const { error } = await admin().from(TABLE).upsert(rows, { onConflict: 'date_key' });
  if (error) {
    console.error('[aamihe_email_daily_log] write:', error.message);
    throw new Error('Não foi possível guardar a quota de e-mail.');
  }
}

export async function importEmailSendDays(days: Record<string, number>): Promise<void> {
  await writeEmailSendDays(days);
}
