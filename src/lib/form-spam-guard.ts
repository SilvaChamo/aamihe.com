import { verifyMathCaptcha } from '@/lib/math-captcha';
import { verifyTurnstile } from '@/lib/turnstile';
import { parseLocale, readLocaleFromFormData, type Locale } from '@/i18n/locale';
import { spamErrors } from '@/i18n/messages';

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

export function validateSpamFields(fields: SpamFields, locale: Locale = 'pt'): SpamGuardResult {
  const t = spamErrors[locale];

  if (fields.honeypot) {
    return { ok: false, error: t.honeypot };
  }

  if (fields.formLoadedAt > 0 && Date.now() - fields.formLoadedAt < 1200) {
    return { ok: false, error: t.tooFast };
  }

  if (!verifyMathCaptcha(fields.mathA, fields.mathB, fields.mathAnswer)) {
    return { ok: false, error: t.mathWrong };
  }

  return { ok: true };
}

export async function validatePublicFormSpam(formData: FormData): Promise<SpamGuardResult> {
  const locale = readLocaleFromFormData(formData);
  const fields = readSpamFields(formData);
  const base = validateSpamFields(fields, locale);
  if (!base.ok) {
    return base;
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    const t = spamErrors[locale];
    if (!fields.turnstileToken) {
      return { ok: false, error: t.turnstileMissing };
    }
    const valid = await verifyTurnstile(fields.turnstileToken);
    if (!valid) {
      return { ok: false, error: t.turnstileFailed };
    }
  }

  return { ok: true };
}

export function validateSpamFromForm(form: HTMLFormElement): SpamGuardResult {
  const formData = new FormData(form);
  const locale = parseLocale(formData.get('locale'));
  return validateSpamFields(readSpamFields(formData), locale);
}
