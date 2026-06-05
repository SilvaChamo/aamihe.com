import { listUsers } from '@/lib/users';
import type { UserListItem } from '@/lib/user-types';
import { isSubscriberRole } from '@/lib/user-types';

export type SenderAccount = {
  id: string;
  email: string;
  name: string;
  label: string;
  from: string;
};

const SYSTEM_SENDERS: Omit<SenderAccount, 'from'>[] = [
  { id: 'noreply', email: 'noreply@aamihe.com', name: 'AAMIHE', label: 'AAMIHE — noreply@aamihe.com' },
  { id: 'geral', email: 'geral@aamihe.com', name: 'AAMIHE', label: 'AAMIHE — geral@aamihe.com' },
];

function formatFrom(name: string, email: string) {
  return `${name} <${email}>`;
}

function isAamiheEmail(email: string) {
  return email.trim().toLowerCase().endsWith('@aamihe.com');
}

/** Conta SMTP autenticada — só este remetente pode enviar via mail.aamihe.com:587. */
function smtpAuthEmail(): string | null {
  const host = process.env.SMTP_HOST?.trim().toLowerCase();
  const user = process.env.SMTP_USER?.trim().toLowerCase();
  if (!user || !host) return null;
  if (host === '127.0.0.1' || host === 'localhost' || host === '::1') return null;
  return user;
}

export async function listSenderAccounts(cachedUsers?: UserListItem[]): Promise<SenderAccount[]> {
  const seen = new Set<string>();
  const accounts: SenderAccount[] = [];
  const authEmail = smtpAuthEmail();

  const push = (entry: Omit<SenderAccount, 'from'>) => {
    const key = entry.email.toLowerCase();
    if (authEmail && key !== authEmail) return;
    if (seen.has(key)) return;
    seen.add(key);
    accounts.push({ ...entry, from: formatFrom(entry.name, entry.email) });
  };

  for (const sender of SYSTEM_SENDERS) {
    push(sender);
  }

  const envFrom = process.env.SITE_EMAIL_FROM || '';
  const envMatch = envFrom.match(/<([^>]+)>/);
  const envEmail = envMatch?.[1] || envFrom;
  if (envEmail && isAamiheEmail(envEmail)) {
    const envName = envFrom.replace(/<[^>]+>/, '').trim() || 'AAMIHE';
    push({
      id: `env-${envEmail}`,
      email: envEmail.toLowerCase(),
      name: envName,
      label: `${envName} — ${envEmail.toLowerCase()}`,
    });
  }

  const users = cachedUsers ?? (await listUsers());
  for (const user of users) {
    if (isSubscriberRole(user.role)) continue;
    if (!isAamiheEmail(user.email)) continue;
    push({
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name || user.username,
      label: `${user.name || user.username} — ${user.email.toLowerCase()}`,
    });
  }

  if (accounts.length === 0 && authEmail) {
    const name = process.env.SITE_EMAIL_FROM?.replace(/<[^>]+>/, '').trim() || 'AAMIHE';
    accounts.push({
      id: 'smtp-auth',
      email: authEmail,
      name,
      label: `${name} — ${authEmail}`,
      from: formatFrom(name, authEmail),
    });
  }

  return accounts;
}

export function resolveSenderFrom(accounts: SenderAccount[], senderId?: string): string {
  const authEmail = smtpAuthEmail();
  const selected = senderId ? accounts.find((a) => a.id === senderId) : accounts[0];
  const name = selected?.name || 'AAMIHE';
  const email = authEmail || selected?.email || 'noreply@aamihe.com';
  return formatFrom(name, email);
}
