import { getSmtpConfigStatus, sendSmtpMail } from '@/lib/smtp-mail';

const DEFAULT_TO = 'geral@aamihe.com';

export const CONFERENCE_SUBMISSION_NOTIFY_EMAILS = [
  'geral@aamihe.com',
  // 'bernadogerson@gmail.com', // desactivado temporariamente (testes)
] as const;

export class EmailSendError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'EmailSendError';
  }
}

type NotifyEmailInput = {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  subject: string;
  text: string;
  html?: string;
};

function normalizeRecipients(value?: string | string[]): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (!value) return [];
  return String(value)
    .split(/[,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export type EmailProviderStatus = {
  configured: boolean;
  from: string;
  mode?: string;
  hint?: string;
};

export function getEmailProviderStatus(): EmailProviderStatus {
  const from = process.env.SITE_EMAIL_FROM?.trim() || 'AAMIHE <noreply@aamihe.com>';
  const smtp = getSmtpConfigStatus();

  return {
    configured: smtp.configured,
    from,
    mode: smtp.mode,
    hint: smtp.hint,
  };
}

function smtpErrorMessage(error: unknown): string {
  const smtpUser = process.env.SMTP_USER?.trim() || 'noreply@aamihe.com';

  if (error && typeof error === 'object') {
    const mailError = error as { message?: string; response?: string; responseCode?: number };
    const raw = [mailError.message, mailError.response].filter(Boolean).join(' — ');
    if (raw) {
      if (/535|incorrect authentication/i.test(raw)) {
        return (
          `Autenticação SMTP recusada (535). Confirme no DirectAdmin a palavra-passe de ${smtpUser} ` +
          `e actualize SMTP_PASS na Vercel (Settings → Environment Variables). ` +
          `SMTP_USER deve ser o mesmo e-mail da conta (${smtpUser}).`
        );
      }
      return raw;
    }
  }
  return error instanceof Error ? error.message : 'Falha ao enviar e-mail pelo SMTP do servidor.';
}

export async function notifySiteEmail(input: NotifyEmailInput): Promise<void> {
  let to = normalizeRecipients(input.to);
  if (!to.length) {
    const fallback = String(process.env.SITE_NOTIFY_EMAIL || DEFAULT_TO).trim();
    if (fallback) to = [fallback];
  }

  const cc = normalizeRecipients(input.cc);
  const bcc = normalizeRecipients(input.bcc);

  if (!to.length) {
    throw new EmailSendError('Nenhum destinatário indicado.');
  }

  const smtp = getSmtpConfigStatus();
  if (!smtp.configured) {
    throw new EmailSendError(
      smtp.hint ||
        'Envio de e-mail não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS (conta DirectAdmin).',
    );
  }

  const from = input.from || process.env.SITE_EMAIL_FROM || 'AAMIHE <noreply@aamihe.com>';

  try {
    const messageId = await sendSmtpMail({
      from,
      to,
      cc,
      bcc,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info('[email] sent via SMTP', { to, subject: input.subject, messageId });
    }
  } catch (error) {
    console.error('[email] SMTP error:', error);
    const mailError = error as { responseCode?: number };
    throw new EmailSendError(smtpErrorMessage(error), mailError.responseCode);
  }
}
