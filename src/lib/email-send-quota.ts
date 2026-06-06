import { readEmailSendDays, writeEmailSendDays } from '@/lib/aamihe-email-quota-store';

/** Limite diário recomendado para domínios em aquecimento (Gmail / reputação de IP). */
export const RECOMMENDED_DAILY_EMAIL_LIMIT = 50;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyLimit() {
  const raw = process.env.EMAIL_DAILY_SEND_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : RECOMMENDED_DAILY_EMAIL_LIMIT;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : RECOMMENDED_DAILY_EMAIL_LIMIT;
}

export type EmailSendQuota = {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  dateKey: string;
};

export function quotaFromSendDays(days: Record<string, number>): EmailSendQuota {
  const dailyLimit = getDailyLimit();
  const dateKey = todayKey();
  const sentToday = days[dateKey] || 0;

  return {
    dailyLimit,
    sentToday,
    remainingToday: Math.max(0, dailyLimit - sentToday),
    dateKey,
  };
}

export async function getEmailSendQuota(): Promise<EmailSendQuota> {
  const days = await readEmailSendDays();
  return quotaFromSendDays(days);
}

export async function assertEmailSendQuota(requested: number): Promise<EmailSendQuota> {
  const quota = await getEmailSendQuota();

  if (requested <= 0) {
    throw new Error('Não há destinatários para enviar.');
  }

  if (requested > quota.remainingToday) {
    throw new Error(
      `Limite diário atingido. Já foram enviados ${quota.sentToday} de ${quota.dailyLimit} e-mails hoje. ` +
        `Restam ${quota.remainingToday} envios disponíveis — tente amanhã ou reduza destinatários.`,
    );
  }

  return quota;
}

export async function recordEmailSends(count: number) {
  if (count <= 0) return;

  const dateKey = todayKey();
  const days = await readEmailSendDays();
  days[dateKey] = (days[dateKey] || 0) + count;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  for (const key of Object.keys(days)) {
    if (key < cutoffKey) delete days[key];
  }

  try {
    await writeEmailSendDays(days);
  } catch (error) {
    console.error('[email-send-quota] record failed after send:', error);
  }
}
