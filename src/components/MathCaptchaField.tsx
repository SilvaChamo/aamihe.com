'use client';

import { useEffect, useId, useState } from 'react';
import './FormAntiSpam.css';

type MathCaptchaFieldProps = {
  className?: string;
  label?: string;
};

export default function MathCaptchaField({ className = '', label = 'Segurança' }: MathCaptchaFieldProps) {
  const inputId = useId();
  const [challenge, setChallenge] = useState<{ a: number; b: number } | null>(null);

  useEffect(() => {
    setChallenge({
      a: Math.floor(Math.random() * 9) + 1,
      b: Math.floor(Math.random() * 9) + 1,
    });
  }, []);

  if (!challenge) {
    return (
      <div className={`math-captcha-field ${className}`.trim()} aria-busy="true">
        <label htmlFor={inputId}>{label}</label>
        <span className="math-captcha-expression" aria-hidden="true">
          … + … =
        </span>
        <input
          id={inputId}
          name="math_answer"
          type="number"
          inputMode="numeric"
          disabled
          aria-label={label}
        />
      </div>
    );
  }

  const { a, b } = challenge;

  return (
    <div className={`math-captcha-field ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <span className="math-captcha-expression" aria-hidden="true">
        {a} + {b} =
      </span>
      <input type="hidden" name="math_a" value={a} readOnly />
      <input type="hidden" name="math_b" value={b} readOnly />
      <input
        id={inputId}
        name="math_answer"
        type="number"
        inputMode="numeric"
        required
        aria-label={`${label}: ${a} mais ${b}`}
      />
    </div>
  );
}
