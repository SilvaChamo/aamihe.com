export type SmtpAccountCredentials = {
  email: string;
  user: string;
  pass: string;
};

const DEFAULT_DOMAIN = 'aamihe.com';

function isLocalSmtpHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1';
}

/** Brevo / Sendinblue: uma credencial SMTP, vários remetentes @domínio no From. */
export function isRelaySmtp(): boolean {
  const host = process.env.SMTP_HOST?.trim().toLowerCase() || '';
  const user = process.env.SMTP_USER?.trim().toLowerCase() || '';
  return (
    host.includes('brevo.com') ||
    host.includes('sendinblue.com') ||
    user.includes('smtp-brevo.com') ||
    user.includes('sendinblue')
  );
}

export function getSmtpFromDomain(): string {
  const explicit = process.env.SMTP_FROM_DOMAIN?.trim();
  if (explicit) return explicit.toLowerCase();

  const from = process.env.SITE_EMAIL_FROM?.trim() || '';
  const match = from.match(/@([\w.-]+)/);
  if (match?.[1]) return match[1].toLowerCase();

  const notify = process.env.SITE_NOTIFY_EMAIL?.trim();
  if (notify?.includes('@')) return notify.split('@')[1]!.toLowerCase();

  return DEFAULT_DOMAIN;
}

function relayFromAddresses(): string[] {
  const domain = getSmtpFromDomain();
  const base = [`noreply@${domain}`, `geral@${domain}`];

  const from = parseFromEmail(process.env.SITE_EMAIL_FROM || '');
  if (from && from.endsWith(`@${domain}`)) base.push(from);

  const notify = process.env.SITE_NOTIFY_EMAIL?.trim().toLowerCase();
  if (notify?.endsWith(`@${domain}`)) base.push(notify);

  return [...new Set(base)];
}

/** Extrai o e-mail de um cabeçalho From («Nome <email@dominio>»). */
export function parseFromEmail(from: string): string {
  const trimmed = from.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim().toLowerCase();
}

function relayCredentials(): SmtpAccountCredentials[] {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) return [];

  return relayFromAddresses().map((email) => ({
    email,
    user,
    pass,
  }));
}

/** Contas SMTP com credenciais definidas (DirectAdmin ou Brevo relay). */
export function listConfiguredSmtpAccounts(): SmtpAccountCredentials[] {
  const host = process.env.SMTP_HOST?.trim();
  if (!host || isLocalSmtpHost(host)) return [];

  if (isRelaySmtp()) {
    return relayCredentials();
  }

  const accounts: SmtpAccountCredentials[] = [];

  const noreplyUser = process.env.SMTP_USER?.trim();
  const noreplyPass = process.env.SMTP_PASS?.trim();
  if (noreplyUser && noreplyPass) {
    accounts.push({
      email: noreplyUser.toLowerCase(),
      user: noreplyUser,
      pass: noreplyPass,
    });
  }

  const geralUser = (process.env.SMTP_GERAL_USER || `geral@${getSmtpFromDomain()}`).trim();
  const geralPass = process.env.SMTP_GERAL_PASS?.trim();
  if (geralUser && geralPass) {
    accounts.push({
      email: geralUser.toLowerCase(),
      user: geralUser,
      pass: geralPass,
    });
  }

  return accounts;
}

export function hasSmtpCredentialsForEmail(email: string): boolean {
  const key = email.trim().toLowerCase();
  const accounts = listConfiguredSmtpAccounts();
  if (accounts.length === 0) return false;

  if (accounts.some((account) => account.email === key)) return true;

  if (isRelaySmtp()) {
    const domain = getSmtpFromDomain();
    return key.endsWith(`@${domain}`);
  }

  return false;
}

export function getSmtpCredentialsForFrom(from: string): SmtpAccountCredentials | null {
  const accounts = listConfiguredSmtpAccounts();
  if (!accounts.length) return null;

  const email = parseFromEmail(from);
  const exact = accounts.find((account) => account.email === email);
  if (exact) return exact;

  if (isRelaySmtp() && email.endsWith(`@${getSmtpFromDomain()}`)) {
    const relay = accounts[0];
    return { email, user: relay.user, pass: relay.pass };
  }

  return accounts[0] ?? null;
}
