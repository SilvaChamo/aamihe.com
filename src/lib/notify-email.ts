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
  from?: string;
  subject: string;
  text: string;
  html?: string;
};

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
  if (error && typeof error === 'object') {
    const mailError = error as { message?: string; response?: string; responseCode?: number };
    const parts = [mailError.message, mailError.response].filter(Boolean);
    if (parts.length) {
      return parts.join(' — ');
    }
  }
  return error instanceof Error ? error.message : 'Falha ao enviar e-mail pelo SMTP do servidor.';
}

export async function notifySiteEmail(input: NotifyEmailInput): Promise<void> {
  const to = Array.isArray(input.to)
    ? input.to.map((entry) => String(entry).trim()).filter(Boolean)
    : [String(input.to || process.env.SITE_NOTIFY_EMAIL || DEFAULT_TO).trim()].filter(Boolean);

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
