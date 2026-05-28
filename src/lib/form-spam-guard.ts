import { verifyMathCaptcha } from '@/lib/math-captcha';
import { verifyTurnstile } from '@/lib/turnstile';

export type SpamGuardResult = { ok: true } | { ok: false; error: string };

export type SpamFields = {
  honeypot: string;
  formLoadedAt: number;
  mathA: number;
  mathB: number;
  mathAnswer: number;
  turnstileToken: string;
};

export function readSpamFields(formData: FormData): SpamFields {
  return {
    honeypot: String(formData.get('company_url') ?? '').trim(),
    formLoadedAt: Number(formData.get('form_loaded_at') ?? 0),
    mathA: Number(formData.get('math_a')),
    mathB: Number(formData.get('math_b')),
    mathAnswer: Number(formData.get('math_answer')),
    turnstileToken: String(formData.get('cf-turnstile-response') ?? '').trim(),
  };
}

export function validateSpamFields(fields: SpamFields): SpamGuardResult {
  if (fields.honeypot) {
    return { ok: false, error: 'Verificação anti-robô falhou.' };
  }

  if (fields.formLoadedAt > 0 && Date.now() - fields.formLoadedAt < 1200) {
    return { ok: false, error: 'Aguarde um momento e tente novamente.' };
  }

  if (!verifyMathCaptcha(fields.mathA, fields.mathB, fields.mathAnswer)) {
    return { ok: false, error: 'Resposta de segurança incorrecta.' };
  }

  return { ok: true };
}

export async function validatePublicFormSpam(formData: FormData): Promise<SpamGuardResult> {
  const fields = readSpamFields(formData);
  const base = validateSpamFields(fields);
  if (!base.ok) {
    return base;
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!fields.turnstileToken) {
      return { ok: false, error: 'Complete a verificação de segurança.' };
    }
    const valid = await verifyTurnstile(fields.turnstileToken);
    if (!valid) {
      return { ok: false, error: 'Verificação de segurança falhou. Tente novamente.' };
    }
  }

  return { ok: true };
}

export function validateSpamFromForm(form: HTMLFormElement): SpamGuardResult {
  return validateSpamFields(readSpamFields(new FormData(form)));
}
