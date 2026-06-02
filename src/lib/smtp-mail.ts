import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type SmtpMailInput = {
  from: string;
  to: string[];
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
        'Configure SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS (conta de e-mail criada no DirectAdmin). No servidor Hetzner pode usar SMTP_HOST=127.0.0.1 e SMTP_PORT=25, ou SMTP_TRANSPORT=sendmail.',
    };
  }

  const port = smtpPort();
  const user = process.env.SMTP_USER?.trim();
  const needsAuth = !isLocalSmtpHost(host);

  if (needsAuth && (!user || !process.env.SMTP_PASS?.trim())) {
    return {
      configured: false,
      mode: 'smtp',
      host,
      port,
      hint:
        'Defina SMTP_USER e SMTP_PASS com uma conta @aamihe.com do DirectAdmin (ex.: noreply@aamihe.com).',
    };
  }

  return {
    configured: true,
    mode: 'smtp',
    host,
    port,
    user: user || undefined,
    hint: needsAuth
      ? `SMTP autenticado em ${host}:${port} (${user}).`
      : `SMTP local em ${host}:${port} (Exim do DirectAdmin). Remetente: ${from}`,
  };
}

let transporter: Mail | null = null;

function createTransporter(): Mail {
  const status = getSmtpConfigStatus();
  if (!status.configured) {
    throw new Error(status.hint || 'SMTP não configurado.');
  }

  if (status.mode === 'sendmail') {
    return nodemailer.createTransport({
      sendmail: true,
      path: process.env.SENDMAIL_PATH?.trim() || '/usr/sbin/sendmail',
      newline: 'unix',
    });
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = smtpPort();
  const secure =
    process.env.SMTP_SECURE === 'true' || port === 465 || process.env.SMTP_SECURE === '1';
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const options: SMTPTransport.Options = {
    host,
    port,
    secure,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : undefined,
  };

  if (user && pass) {
    options.auth = { user, pass };
  }

  return nodemailer.createTransport(options);
}

function getTransporter(): Mail {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

export async function sendSmtpMail(input: SmtpMailInput): Promise<string> {
  const transport = getTransporter();
  const info = await transport.sendMail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, '<br />'),
  });
  return String(info.messageId || info.response || 'sent');
}

export async function verifySmtpConnection(): Promise<void> {
  const transport = getTransporter();
  if (typeof transport.verify === 'function') {
    await transport.verify();
  }
}
