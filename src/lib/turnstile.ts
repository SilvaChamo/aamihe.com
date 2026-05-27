export const TURNSTILE_SITE_KEY_PROD =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAABeKvhulGQywv3RQ';
export const TURNSTILE_SITE_KEY_TEST = '1x00000000000000000000AA';
const TURNSTILE_SECRET_TEST = '1x0000000000000000000000000000000AA';

export type TurnstileKeyMode = 'prod' | 'test';

export function isLocalTurnstileHost(hostname: string) {
  const host = hostname.replace(/:\d+$/, '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
}

async function verifyWithSecret(token: string, secret: string) {
  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const result = await response.json();
  return result.success === true;
}

export async function verifyTurnstile(token: string, keyMode: TurnstileKeyMode = 'prod') {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY não configurado — verificação Turnstile ignorada.');
    return true;
  }

  if (!token) {
    return false;
  }

  if (keyMode === 'test') {
    return verifyWithSecret(token, TURNSTILE_SECRET_TEST);
  }

  if (await verifyWithSecret(token, secret)) {
    return true;
  }

  if (process.env.NODE_ENV === 'development') {
    return verifyWithSecret(token, TURNSTILE_SECRET_TEST);
  }

  return false;
}
