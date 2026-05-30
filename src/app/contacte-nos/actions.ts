'use server';

import { validatePublicFormSpam } from '@/lib/form-spam-guard';
import { readLocaleFromFormData } from '@/i18n/locale';
import { contactFormErrors } from '@/i18n/messages';

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

  const locale = readLocaleFromFormData(formData);
  const t = contactFormErrors[locale];

  if (!firstName || !lastName) {
    return { success: false, error: t.nameRequired };
  }

  if (!email || !message) {
    return { success: false, error: t.emailMessageRequired };
  }

  if (!terms) {
    return { success: false, error: t.termsRequired };
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
