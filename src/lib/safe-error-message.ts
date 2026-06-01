const HTML_MARKERS = /<!doctype|<html[\s>]|<head[\s>]|<body[\s>]|<\/html>|404 not found|not found on this server/i;

/** Evita mostrar HTML de proxy/Apache ou respostas técnicas ao utilizador. */
export function safeErrorMessage(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  const raw = typeof value === 'string' ? value : value instanceof Error ? value.message : String(value);
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '{}' || trimmed === '[]') return fallback;
  if (HTML_MARKERS.test(trimmed)) return fallback;
  if (trimmed.length > 280) return fallback;
  return trimmed;
}

/** Lê JSON de uma resposta fetch da API; nunca devolve HTML bruto. */
export async function readApiJsonResponse(
  response: Response,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const fallback =
      response.status === 404
        ? 'Serviço de login temporariamente indisponível. Tente com o email completo ou mais tarde.'
        : 'Resposta inválida do servidor. Tente novamente.';
    return { ok: false, status: response.status, data: { success: false, error: fallback } };
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (typeof data.error === 'string') {
      data.error = safeErrorMessage(data.error, 'Não foi possível concluir o pedido.');
    }
    return { ok: true, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: response.status,
      data: { success: false, error: 'Resposta inválida do servidor. Tente novamente.' },
    };
  }
}
