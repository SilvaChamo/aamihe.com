/** Origem do pedido HTTP (OAuth, callbacks). */
export function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

/** Origem pública do site (emails, links) — aamihe.com, nunca supabase.co. */
export function getPublicSiteOrigin(request?: Request): string {
  if (request) {
    const origin = new URL(request.url).origin;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return origin;
    }
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (request) return new URL(request.url).origin;
  return 'https://aamihe.com';
}
