import { getRequestOrigin } from '@/lib/site-url';

export function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    ''
  );
}

export function getGoogleClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
}

export function getGoogleRedirectUri(request: Request): string {
  return `${getRequestOrigin(request)}/api/auth/google/callback`;
}

export function buildGoogleAuthUrl(request: Request, state: string): string {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('Google OAuth não configurado (GOOGLE_CLIENT_ID).');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getGoogleRedirectUri(request));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeGoogleCode(
  code: string,
  request: Request,
): Promise<{ id_token?: string; error?: string }> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    return { error: 'Google OAuth não configurado no servidor.' };
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleRedirectUri(request),
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.id_token) {
    return { error: data.error_description || data.error || 'Falha ao obter token Google.' };
  }

  return { id_token: data.id_token };
}
