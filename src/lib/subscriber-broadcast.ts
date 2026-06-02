import type { DashboardDb } from '@/lib/dashboard-db';
import { getDashboardDb } from '@/lib/dashboard-db';
import { htmlToPlainText, wrapMarketingEmailHtml, wrapPlainEmailHtml } from '@/lib/email-template';
import { listSenderAccounts, resolveSenderFrom } from '@/lib/sender-accounts';
import {
  assertEmailSendQuota,
  getEmailSendQuotaFromDb,
  recordEmailSends,
  type EmailSendQuota,
} from '@/lib/email-send-quota';
import { notifySiteEmail } from '@/lib/notify-email';
import { listUsers } from '@/lib/users';
import type { UserListItem } from '@/lib/user-types';
import { isSubscriberRole } from '@/lib/user-types';

export function collectSubscriberEmailsFrom(users: UserListItem[], db: DashboardDb): string[] {
  const emails = new Set<string>();

  for (const user of users) {
    if (isSubscriberRole(user.role) && user.email?.trim()) {
      emails.add(user.email.trim().toLowerCase());
    }
  }

  for (const doc of db.documents) {
    if (doc.category !== 'conferencia') continue;
    const email = String(doc.email || '').trim().toLowerCase();
    if (email) emails.add(email);
  }

  return Array.from(emails);
}

export async function collectSubscriberEmails(): Promise<string[]> {
  const [users, db] = await Promise.all([listUsers(), getDashboardDb()]);
  return collectSubscriberEmailsFrom(users, db);
}

/** Uma leitura do dashboard + utilizadores (evita vários GET ao Blob na mesma página). */
export async function loadBroadcastPageData(): Promise<{
  emails: string[];
  quota: EmailSendQuota;
  senders: Awaited<ReturnType<typeof listSenderAccounts>>;
}> {
  const [users, db] = await Promise.all([listUsers(), getDashboardDb()]);
  const emails = collectSubscriberEmailsFrom(users, db);
  const quota = getEmailSendQuotaFromDb(db);
  const senders = await listSenderAccounts(users);
  return { emails, quota, senders };
}

type BroadcastInput = {
  subject: string;
  html: string;
  preheader?: string;
  message?: string;
  senderId?: string;
  mode?: 'marketing' | 'normal';
};

export async function broadcastToSubscribers(input: BroadcastInput): Promise<number> {
  const emails = await collectSubscriberEmails();
  if (!emails.length) {
    throw new Error('Não há subscritores com e-mail registado.');
  }

  await assertEmailSendQuota(emails.length);

  const bodyHtml = input.html.trim();
  const text = input.message?.trim() || htmlToPlainText(bodyHtml);
  const mode = input.mode === 'normal' ? 'normal' : 'marketing';
  const fullHtml =
    mode === 'normal'
      ? wrapPlainEmailHtml(bodyHtml, input.preheader)
      : wrapMarketingEmailHtml(bodyHtml);

  const senders = await listSenderAccounts();
  const from = resolveSenderFrom(senders, input.senderId);

  for (const to of emails) {
    await notifySiteEmail({
      to,
      from,
      subject: input.subject.trim(),
      text,
      html: fullHtml,
    });
  }

  await recordEmailSends(emails.length);

  return emails.length;
}
