/** Cache de dados no browser (sessão, notificações, etc.) — 24 horas. */
export const CLIENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function isCacheEntryFresh(fetchedAtMs: number | null | undefined): boolean {
  if (!fetchedAtMs) return false;
  return Date.now() - fetchedAtMs < CLIENT_CACHE_TTL_MS;
}
