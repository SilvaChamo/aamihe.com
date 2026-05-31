import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function requestPasswordResetEmail(email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error('Supabase não configurado.');
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://aamihe.com');

  const redirectTo = `${siteUrl.replace(/\/$/, '')}/auth/confirm?next=/admin/login?action=new-password`;

  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}
