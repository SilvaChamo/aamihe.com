'use server';

import { validatePublicFormSpam } from '@/lib/form-spam-guard';

export type ContactFormResult = {
  success: boolean;
  error?: string;
};

export async function submitContactForm(formData: FormData): Promise<ContactFormResult> {
  const spam = await validatePublicFormSpam(formData);
  if (!spam.ok) {
    return { success: false, error: spam.error };
  }

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const contact = String(formData.get('contact') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const terms = formData.get('terms');

  if (!firstName || !lastName) {
    return { success: false, error: 'Preencha o nome e o apelido.' };
  }

  if (!email || !message) {
    return { success: false, error: 'Preencha o email e a mensagem.' };
  }

  if (!terms) {
    return { success: false, error: 'Deve aceitar os termos para enviar.' };
  }

  console.info('[contact]', {
    firstName,
    lastName,
    contact,
    email,
    messageLength: message.length,
  });

  return { success: true };
}
