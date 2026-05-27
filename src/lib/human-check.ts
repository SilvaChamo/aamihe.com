export type HumanCheckPayload = {
  humanCheck?: boolean;
  honeypot?: string;
  formLoadedAt?: number;
};

export function verifyHumanCheck(payload: HumanCheckPayload) {
  if (String(payload.honeypot || '').trim()) {
    return { ok: false, error: 'Verificação anti-robô falhou.' };
  }

  if (!payload.humanCheck) {
    return { ok: false, error: 'Confirme que é humano antes de continuar.' };
  }

  const loadedAt = Number(payload.formLoadedAt || 0);
  if (loadedAt > 0 && Date.now() - loadedAt < 1200) {
    return { ok: false, error: 'Aguarde um momento e tente novamente.' };
  }

  return { ok: true };
}
