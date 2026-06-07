import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPublicSiteHost, getPublicSiteOrigin } from '@/lib/site-url';
import { getSmtpConfigStatus, sendSmtpMail } from '@/lib/smtp-mail';

function useSiteSmtpForPasswordReset(): boolean {
  const forced = process.env.PASSWORD_RESET_USE_SITE_SMTP?.trim().toLowerCase();
  if (forced === 'true') return true;
  if (forced === 'false') return false;
  return getSmtpConfigStatus().configured;
}

function siteUrl(): string {
  return getPublicSiteOrigin();
}

function recoveryRedirectTo(): string {
  return `${siteUrl()}/auth/confirm?next=/dashboard/login?action=new-password`;
}

/** Link directo para /auth/confirm — evita redirect_to errado do Supabase. */
function buildRecoveryConfirmLink(hashedToken: string): string {
  const url = new URL(recoveryRedirectTo());
  url.searchParams.set('token_hash', hashedToken);
  url.searchParams.set('type', 'recovery');
  return url.toString();
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
    return 'O Supabase no servidor não alcança o SMTP (ex.: mail.aamihe.com:587). No VPS execute fix-auth-recovery-email.sh para usar Exim local na porta 25.';
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
      'Ligação SMTP falhou (porta 587 bloqueada ou SMTP_HOST errado no Supabase). No VPS: bash fix-auth-recovery-email.sh',
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

  const siteHost = getPublicSiteHost();
  const from = process.env.SITE_EMAIL_FROM?.trim() || 'AAMIHE <noreply@aamihe.com>';
  const subject = `Repor senha — ${siteHost}`;
  const text = [
    `Recebeu este email porque foi pedida a reposição da senha da sua conta AAMIHE (${siteHost}).`,
    '',
    'Abra o link abaixo (válido por tempo limitado):',
    actionLink,
    '',
    'Se não fez este pedido, ignore este email.',
    '',
    `— AAMIHE (${siteHost})`,
  ].join('\n');

  await sendSmtpMail({
    from,
    to: [email],
    subject,
    text,
    html: `<p>Recebeu este email porque foi pedida a reposição da senha da sua conta <strong>AAMIHE (${siteHost})</strong>.</p>
<p><a href="${actionLink}">Repor senha — ${siteHost}</a></p>
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

  const hashedToken = data?.properties?.hashed_token?.trim();
  if (!hashedToken) {
    throw new Error('Não foi possível gerar o link de recuperação. Confirme que a conta existe no Supabase Auth.');
  }

  try {
    await sendRecoveryEmailViaSmtp(email, buildRecoveryConfirmLink(hashedToken));
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
