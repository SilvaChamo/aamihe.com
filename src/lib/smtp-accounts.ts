export type SmtpAccountCredentials = {
  email: string;
  user: string;
  pass: string;
};

function isLocalSmtpHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1';
}

/** Extrai o e-mail de um cabeçalho From («Nome <email@dominio>»). */
export function parseFromEmail(from: string): string {
  const trimmed = from.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim().toLowerCase();
}

/** Contas SMTP com credenciais definidas (DirectAdmin / Vercel). */
export function listConfiguredSmtpAccounts(): SmtpAccountCredentials[] {
  const host = process.env.SMTP_HOST?.trim();
  if (!host || isLocalSmtpHost(host)) return [];

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

  const geralUser = (process.env.SMTP_GERAL_USER || 'geral@aamihe.com').trim();
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
  return listConfiguredSmtpAccounts().some((account) => account.email === key);
}

export function getSmtpCredentialsForFrom(from: string): SmtpAccountCredentials | null {
  const accounts = listConfiguredSmtpAccounts();
  if (!accounts.length) return null;

  const email = parseFromEmail(from);
  return accounts.find((account) => account.email === email) ?? accounts[0];
}
