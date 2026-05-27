'use server';

import { verifyTurnstile } from '@/lib/turnstile';

export type ContactFormResult = {
  success: boolean;
  error?: string;
};

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const terms = formData.get('terms');
  const turnstileToken = String(formData.get('cf-turnstile-response') ?? '').trim();

  if (!email || !message) {
    return { success: false, error: 'Preencha o email e a mensagem.' };
  }

  if (!terms) {
    return { success: false, error: 'Deve aceitar os termos para enviar.' };
  }

  if (turnstileToken) {
    const valid = await verifyTurnstile(turnstileToken);
    if (!valid) {
      return { success: false, error: 'Verificação de segurança falhou. Tente novamente.' };
    }
  }

  // Reservado: integração email/CRM. Por agora validação + sucesso.
  console.info('[contact]', { name, email, messageLength: message.length });

  return { success: true };
}
