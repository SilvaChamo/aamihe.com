import { getSupabaseAdmin } from '@/lib/supabase/server';

function resetEmailErrorMessage(error: { message?: string; status?: number }): string {
  if (error.status === 504) {
    return 'O servidor de email do Supabase não respondeu. Configure Custom SMTP em Supabase → Authentication → SMTP (mail.aamihe.com).';
  }
  const msg = String(error.message || '').trim();
  if (!msg || msg === '{}') {
    return 'Não foi possível enviar o email de recuperação. Configure SMTP no Supabase ou contacte a administração.';
  }
  return msg;
}

export async function requestPasswordResetEmail(email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error('Supabase não configurado.');
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3004');

  const redirectTo = `${siteUrl.replace(/\/$/, '')}/auth/confirm?next=/admin/login?action=new-password`;

  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw new Error(resetEmailErrorMessage(error));
  }
}
