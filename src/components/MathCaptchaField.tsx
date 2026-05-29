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
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setChallenge({
      a: Math.floor(Math.random() * 9) + 1,
      b: Math.floor(Math.random() * 9) + 1,
    });
  }, []);

  const ready = challenge !== null;
  const { a, b } = challenge ?? { a: 0, b: 0 };

  return (
    <div className={`math-captcha-field ${className}`.trim()} aria-busy={!ready}>
      <label htmlFor={inputId}>{label}</label>
      <span className="math-captcha-expression" aria-hidden="true">
        {ready ? `${a} + ${b} =` : '… + … ='}
      </span>
      {ready ? (
        <>
          <input type="hidden" name="math_a" value={a} readOnly />
          <input type="hidden" name="math_b" value={b} readOnly />
        </>
      ) : null}
      <input
        id={inputId}
        name="math_answer"
        type="number"
        inputMode="numeric"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={!ready}
        required={ready}
        aria-label={ready ? `${label}: ${a} mais ${b}` : label}
      />
    </div>
  );
}
