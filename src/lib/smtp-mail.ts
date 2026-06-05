import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  getSmtpCredentialsForFrom,
  listConfiguredSmtpAccounts,
  parseFromEmail,
} from '@/lib/smtp-accounts';

export type SmtpMailInput = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
};

export type SmtpConfigStatus = {
  configured: boolean;
  mode: 'smtp' | 'sendmail' | 'none';
  host?: string;
  port?: number;
  user?: string;
  hint?: string;
};

function smtpPort(): number {
  const parsed = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 587;
}

function isLocalSmtpHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === '127.0.0.1' || normalized === 'localhost' || normalized === '::1';
}

export function getSmtpConfigStatus(): SmtpConfigStatus {
  const from = process.env.SITE_EMAIL_FROM?.trim() || 'AAMIHE <noreply@aamihe.com>';
  const transport = process.env.SMTP_TRANSPORT?.trim().toLowerCase();

  if (transport === 'sendmail') {
    const path = process.env.SENDMAIL_PATH?.trim() || '/usr/sbin/sendmail';
    return {
      configured: true,
      mode: 'sendmail',
      hint: `Envio via sendmail (${path}), o mesmo caminho usado pelo DirectAdmin/PHP no servidor.`,
    };
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    return {
      configured: false,
      mode: 'none',
      hint:
        'Configure SMTP_HOST, SMTP_PORT e credenciais (SMTP_USER/SMTP_PASS e opcionalmente SMTP_GERAL_PASS).',
    };
  }

  const port = smtpPort();
  const accounts = listConfiguredSmtpAccounts();
  const needsAuth = !isLocalSmtpHost(host);

  if (needsAuth && accounts.length === 0) {
    return {
      configured: false,
      mode: 'smtp',
      host,
      port,
      hint:
        'Defina SMTP_USER/SMTP_PASS (noreply@aamihe.com) e SMTP_GERAL_PASS (geral@aamihe.com) no DirectAdmin/Vercel.',
    };
  }

  const accountList = accounts.map((a) => a.email).join(', ');

  return {
    configured: true,
    mode: 'smtp',
    host,
    port,
    user: accounts[0]?.user,
    hint: needsAuth
      ? `SMTP em ${host}:${port} — contas: ${accountList || process.env.SMTP_USER}.`
      : `SMTP local em ${host}:${port} (Exim). Remetente: ${from}`,
  };
}

const transporterCache = new Map<string, Mail>();

function createAuthenticatedTransporter(credentials: { user: string; pass: string }): Mail {
  const host = process.env.SMTP_HOST!.trim();
  const port = smtpPort();
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465 || process.env.SMTP_SECURE === '1';

  const options: SMTPTransport.Options = {
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user: credentials.user, pass: credentials.pass },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls:
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : undefined,
  };

  return nodemailer.createTransport(options);
}

function createSendmailTransporter(): Mail {
  return nodemailer.createTransport({
    sendmail: true,
    path: process.env.SENDMAIL_PATH?.trim() || '/usr/sbin/sendmail',
    newline: 'unix',
  });
}

function createLocalTransporter(): Mail {
  const host = process.env.SMTP_HOST!.trim();
  const port = smtpPort();
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465 || process.env.SMTP_SECURE === '1';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls:
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

function getTransporterForFrom(from: string): Mail {
  const status = getSmtpConfigStatus();
  if (!status.configured) {
    throw new Error(status.hint || 'SMTP não configurado.');
  }

  if (status.mode === 'sendmail') {
    const key = 'sendmail';
    if (!transporterCache.has(key)) {
      transporterCache.set(key, createSendmailTransporter());
    }
    return transporterCache.get(key)!;
  }

  const host = process.env.SMTP_HOST!.trim();
  if (isLocalSmtpHost(host)) {
    const key = 'local';
    if (!transporterCache.has(key)) {
      transporterCache.set(key, createLocalTransporter());
    }
    return transporterCache.get(key)!;
  }

  const credentials = getSmtpCredentialsForFrom(from);
  if (!credentials) {
    throw new Error(
      `Sem credenciais SMTP para ${parseFromEmail(from)}. Configure SMTP_PASS ou SMTP_GERAL_PASS.`,
    );
  }

  const cacheKey = credentials.email;
  if (!transporterCache.has(cacheKey)) {
    transporterCache.set(cacheKey, createAuthenticatedTransporter(credentials));
  }
  return transporterCache.get(cacheKey)!;
}

export async function sendSmtpMail(input: SmtpMailInput): Promise<string> {
  const transport = getTransporterForFrom(input.from);
  const info = await transport.sendMail({
    from: input.from,
    to: input.to,
    cc: input.cc?.length ? input.cc : undefined,
    bcc: input.bcc?.length ? input.bcc : undefined,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, '<br />'),
  });
  return String(info.messageId || info.response || 'sent');
}

export async function verifySmtpConnection(): Promise<void> {
  const accounts = listConfiguredSmtpAccounts();
  if (accounts.length === 0) {
    const transport = getTransporterForFrom(
      process.env.SITE_EMAIL_FROM || 'AAMIHE <noreply@aamihe.com>',
    );
    if (typeof transport.verify === 'function') {
      await transport.verify();
    }
    return;
  }

  for (const account of accounts) {
    const transport = getTransporterForFrom(`${account.user} <${account.email}>`);
    if (typeof transport.verify === 'function') {
      await transport.verify();
    }
  }
}
