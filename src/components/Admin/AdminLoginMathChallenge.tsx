'use client';

import { useId } from 'react';
import '@/components/FormAntiSpam.css';

type AdminLoginMathChallengeProps = {
  mathA: number;
  mathB: number;
  answer: string;
  onAnswerChange: (value: string) => void;
  label?: string;
};

export default function AdminLoginMathChallenge({
  mathA,
  mathB,
  answer,
  onAnswerChange,
  label = 'Desafio',
}: AdminLoginMathChallengeProps) {
  const inputId = useId();

  return (
    <div className="math-captcha-field admin-login-math-captcha">
      <label htmlFor={inputId}>{label}</label>
      <span className="math-captcha-expression" aria-hidden="true">
        {mathA} + {mathB} =
      </span>
      <input
        id={inputId}
        name="math_answer"
        type="number"
        inputMode="numeric"
        className="input"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        required
        aria-label={`${label}: ${mathA} mais ${mathB}`}
      />
    </div>
  );
}

export function createLoginMathChallenge() {
  return {
    a: Math.floor(Math.random() * 9) + 1,
    b: Math.floor(Math.random() * 9) + 1,
  };
}
