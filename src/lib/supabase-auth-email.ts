import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getSmtpConfigStatus, sendSmtpMail } from '@/lib/smtp-mail';

/** Na Vercel, mail.aamihe.com:587 no Hetzner costuma dar ETIMEDOUT — o email sai pelo GoTrue no VPS. */
function useSiteSmtpForPasswordReset(): boolean {
  const forced = process.env.PASSWORD_RESET_USE_SITE_SMTP?.trim().toLowerCase();
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  if (process.env.VERCEL) return false;
  return getSmtpConfigStatus().configured;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3004')
  ).replace(/\/$/, '');
}

function recoveryRedirectTo(): string {
  return `${siteUrl()}/auth/confirm?next=/dashboard/login?action=new-password`;
}

function resetEmailErrorMessage(error: { message?: string; status?: number }): string {
  const raw = String(error.message || '').trim();
  if (error.status === 504) {
    return 'O servidor de email não respondeu a tempo. Verifique SMTP na Vercel (mail.aamihe.com) ou no Supabase Studio.';
  }
  if (/error sending recovery email/i.test(raw)) {
    return 'O Supabase no servidor não conseguiu enviar o email. No VPS execute configure-smtp-env.sh (Exim local, porta 25) ou configure SMTP no Studio → Authentication → Emails.';
  }
  const rateLimit = raw.match(/only request this after (\d+) seconds/i);
  if (rateLimit) {
    return `Aguarde ${rateLimit[1]} segundos e tente novamente (limite de segurança).`;
  }
  if (/etimedout|econnrefused|enotfound/i.test(raw)) {
    return 'Servidor de email inacessível a partir da cloud. A reposição de senha deve usar o email enviado pelo Supabase no Hetzner (configure SMTP no VPS).';
  }
  if (!raw || raw === '{}') {
    return 'Não foi possível enviar o email de recuperação. Contacte a administração.';
  }
  return raw;
}

function wrapSmtpError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/etimedout|econnrefused/i.test(msg)) {
    return new Error(
      'Não foi possível ligar ao servidor de email (porta bloqueada para a Vercel). Em produção o email é enviado pelo Supabase no Hetzner — configure SMTP no VPS.',
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

async function sendRecoveryEmailViaSmtp(email: string, actionLink: string): Promise<void> {
  const smtp = getSmtpConfigStatus();
  if (!smtp.configured) {
    throw new Error(
      'SMTP do site não configurado na Vercel (SMTP_HOST, SMTP_USER, SMTP_PASS). Sem isto não é possível enviar o link de recuperação.',
    );
  }

  const from = process.env.SITE_EMAIL_FROM?.trim() || 'AAMIHE <noreply@aamihe.com>';
  const subject = 'Repor senha — AAMIHE';
  const text = [
    'Recebeu este email porque foi pedida a reposição da senha da sua conta AAMIHE.',
    '',
    'Abra o link abaixo (válido por tempo limitado):',
    actionLink,
    '',
    'Se não fez este pedido, ignore este email.',
    '',
    '— AAMIHE',
  ].join('\n');

  await sendSmtpMail({
    from,
    to: [email],
    subject,
    text,
    html: `<p>Recebeu este email porque foi pedida a reposição da senha da sua conta <strong>AAMIHE</strong>.</p>
<p><a href="${actionLink}">Repor senha</a></p>
<p>Se o botão não funcionar, copie este endereço para o browser:<br /><a href="${actionLink}">${actionLink}</a></p>
<p>Se não fez este pedido, ignore este email.</p>`,
  });
}

async function sendViaGoTrue(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string,
  redirectTo: string,
): Promise<void> {
  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw new Error(resetEmailErrorMessage(error));
  }
}

async function sendViaSiteSmtp(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string,
  redirectTo: string,
): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });

  if (error) {
    throw new Error(resetEmailErrorMessage(error));
  }

  const actionLink =
    data?.properties?.action_link?.trim() ||
    (data as { action_link?: string } | null)?.action_link?.trim();

  if (!actionLink) {
    throw new Error('Não foi possível gerar o link de recuperação. Confirme que a conta existe no Supabase Auth.');
  }

  try {
    await sendRecoveryEmailViaSmtp(email, actionLink);
  } catch (err) {
    throw wrapSmtpError(err);
  }
}

export async function requestPasswordResetEmail(email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error('Supabase não configurado.');
  }

  const redirectTo = recoveryRedirectTo();
  const normalized = email.trim().toLowerCase();

  if (useSiteSmtpForPasswordReset()) {
    await sendViaSiteSmtp(admin, normalized, redirectTo);
    return;
  }

  await sendViaGoTrue(admin, normalized, redirectTo);
}
