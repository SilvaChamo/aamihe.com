import { getGoogleClientId } from '@/lib/google-oauth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  error?: string;
  error_description?: string;
};

/** Valida id_token Google na app (Vercel alcança Google; GoTrue no VPS muitas vezes não). */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<{ email: string } | { error: string }> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return { error: 'Google OAuth não configurado (GOOGLE_CLIENT_ID).' };
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { cache: 'no-store' },
  );
  const data = (await res.json().catch(() => ({}))) as GoogleTokenInfo;

  if (!res.ok) {
    return {
      error: data.error_description || data.error || 'Token Google inválido ou expirado.',
    };
  }

  if (data.aud !== clientId) {
    return { error: 'Token Google não corresponde a esta aplicação.' };
  }

  const email = data.email?.trim().toLowerCase();
  if (!email) {
    return { error: 'Conta Google sem email.' };
  }

  const verified = data.email_verified === true || data.email_verified === 'true';
  if (!verified) {
    return { error: 'O email Google ainda não está verificado.' };
  }

  return { email };
}

/** Sessão Supabase sem signInWithIdToken (evita GoTrue ir buscar OIDC ao Google). */
export async function createSupabaseSessionForEmail(email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error('Supabase não configurado.');
  }

  const normalized = email.trim().toLowerCase();
  const linkResult = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: normalized,
  });

  const hashedToken = linkResult.data?.properties?.hashed_token?.trim();
  if (linkResult.error || !hashedToken) {
    throw new Error(linkResult.error?.message || 'Não foi possível criar sessão AAMIHE.');
  }

  const verified = await admin.auth.verifyOtp({
    type: 'magiclink',
    token_hash: hashedToken,
  });

  if (verified.error || !verified.data.session || !verified.data.user) {
    throw new Error(verified.error?.message || 'Não foi possível criar sessão AAMIHE.');
  }

  return verified.data;
}
