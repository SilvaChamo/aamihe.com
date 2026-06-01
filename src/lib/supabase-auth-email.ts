import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getSmtpConfigStatus, sendSmtpMail } from '@/lib/smtp-mail';

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
    return 'Não foi possível enviar o email pelo Supabase. O site tenta enviar via SMTP da Vercel — confirme SMTP_HOST, SMTP_USER e SMTP_PASS no painel Vercel.';
  }
  if (!raw || raw === '{}') {
    return 'Não foi possível enviar o email de recuperação. Configure SMTP na Vercel ou contacte a administração.';
  }
  return raw;
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

export async function requestPasswordResetEmail(email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error('Supabase não configurado.');
  }

  const redirectTo = recoveryRedirectTo();
  const normalized = email.trim().toLowerCase();

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: normalized,
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
    await sendRecoveryEmailViaSmtp(normalized, actionLink);
  } catch (smtpErr) {
    const smtpMsg = smtpErr instanceof Error ? smtpErr.message : String(smtpErr);
    const { error: fallbackError } = await admin.auth.resetPasswordForEmail(normalized, { redirectTo });
    if (fallbackError) {
      throw new Error(
        `${smtpMsg} O Supabase também falhou: ${resetEmailErrorMessage(fallbackError)}`,
      );
    }
  }
}
