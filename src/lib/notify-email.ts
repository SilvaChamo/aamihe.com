const DEFAULT_TO = 'geral@aamihe.com';

export const CONFERENCE_SUBMISSION_NOTIFY_EMAILS = [
  'geral@aamihe.com',
  // 'bernadogerson@gmail.com', // desactivado temporariamente (testes)
] as const;

type NotifyEmailInput = {
  to?: string | string[];
  from?: string;
  subject: string;
  text: string;
  html?: string;
};

export async function notifySiteEmail(input: NotifyEmailInput): Promise<void> {
  const to = Array.isArray(input.to)
    ? input.to.filter(Boolean)
    : [input.to || process.env.SITE_NOTIFY_EMAIL || DEFAULT_TO];
  const from = input.from || process.env.SITE_EMAIL_FROM || 'AAMIHE <noreply@aamihe.com>';
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: input.subject,
          text: input.text,
          html: input.html ?? input.text.replace(/\n/g, '<br />'),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error('[email] Resend error:', res.status, body);
      }
      return;
    } catch (error) {
      console.error('[email] Resend request failed:', error);
    }
  }

  console.info('[email]', { to, subject: input.subject, text: input.text });
}
