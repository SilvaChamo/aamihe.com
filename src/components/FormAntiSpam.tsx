'use client';

import { useEffect, useState } from 'react';
import MathCaptchaField from '@/components/MathCaptchaField';
import { useLanguage } from '@/context/LanguageContext';
import { galleryCopy } from '@/i18n/messages';
import './FormAntiSpam.css';

type FormAntiSpamProps = {
  showMath?: boolean;
  mathLabel?: string;
  mathClassName?: string;
};

export default function FormAntiSpam({
  showMath = true,
  mathLabel = 'Segurança',
  mathClassName = '',
}: FormAntiSpamProps) {
  const { locale } = useLanguage();
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  useEffect(() => {
    setLoadedAt(Date.now());
  }, []);

  return (
    <>
      <input
        type="text"
        name="company_url"
        className="form-honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {loadedAt !== null ? (
        <input type="hidden" name="form_loaded_at" value={loadedAt} readOnly />
      ) : null}
      <input type="hidden" name="locale" value={locale} readOnly />
      {showMath ? (
        <MathCaptchaField
          className={mathClassName}
          label={mathLabel}
          plusWord={galleryCopy[locale].mathPlus}
        />
      ) : null}
    </>
  );
}
