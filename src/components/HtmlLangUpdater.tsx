'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { htmlLangForLocale } from '@/i18n/locale';

export default function HtmlLangUpdater() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = htmlLangForLocale(locale);
  }, [locale]);

  return null;
}
