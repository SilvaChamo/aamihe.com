import { getDashboardDb } from '@/lib/dashboard-db';
import { htmlToPlainText, wrapMarketingEmailHtml, wrapPlainEmailHtml } from '@/lib/email-template';
import { listSenderAccounts, resolveSenderFrom } from '@/lib/sender-accounts';
import { assertEmailSendQuota, recordEmailSends } from '@/lib/email-send-quota';
import { notifySiteEmail } from '@/lib/notify-email';
import { listUsers } from '@/lib/users';
import { isSubscriberRole } from '@/lib/user-types';

export async function collectSubscriberEmails(): Promise<string[]> {
  const emails = new Set<string>();

  const users = await listUsers();
  for (const user of users) {
    if (isSubscriberRole(user.role) && user.email?.trim()) {
      emails.add(user.email.trim().toLowerCase());
    }
  }

  const db = await getDashboardDb();
  for (const doc of db.documents) {
    if (doc.category !== 'conferencia') continue;
    const email = String(doc.email || '').trim().toLowerCase();
    if (email) emails.add(email);
  }

  return Array.from(emails);
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
