import { hasSmtpCredentialsForEmail, listConfiguredSmtpAccounts } from '@/lib/smtp-accounts';
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

function canSendAs(email: string): boolean {
  const configured = listConfiguredSmtpAccounts();
  if (configured.length === 0) return true;
  return hasSmtpCredentialsForEmail(email);
}

export async function listSenderAccounts(cachedUsers?: UserListItem[]): Promise<SenderAccount[]> {
  const seen = new Set<string>();
  const accounts: SenderAccount[] = [];

  const push = (entry: Omit<SenderAccount, 'from'>) => {
    const key = entry.email.toLowerCase();
    if (!canSendAs(key)) return;
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

  return accounts;
}

export function resolveSenderFrom(accounts: SenderAccount[], senderId?: string): string {
  const selected = senderId ? accounts.find((a) => a.id === senderId) : accounts[0];
  const name = selected?.name || 'AAMIHE';
  const email = selected?.email || 'noreply@aamihe.com';
  return formatFrom(name, email);
}
