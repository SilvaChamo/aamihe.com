export type Locale = 'pt' | 'fr' | 'en';

export const DEFAULT_LOCALE: Locale = 'pt';

export function parseLocale(value: unknown): Locale {
  if (value === 'fr' || value === 'en' || value === 'pt') {
    return value;
  }
  return DEFAULT_LOCALE;
}

export function readLocaleFromFormData(formData: FormData): Locale {
  return parseLocale(formData.get('locale'));
}

export function htmlLangForLocale(locale: Locale): string {
  if (locale === 'pt') return 'pt-PT';
  if (locale === 'fr') return 'fr';
  return 'en';
}
