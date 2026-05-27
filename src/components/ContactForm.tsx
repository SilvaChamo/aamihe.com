'use client';

import { useState, type FormEvent } from 'react';
import { submitContactForm } from '@/app/contacte-nos/actions';

type ContactFormProps = {
  labels: {
    name: string;
    email: string;
    message: string;
    terms: string;
    termsRequired: string;
    submit: string;
    success: string;
    error: string;
  };
};

export default function ContactForm({ labels }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
        setErrorMessage(result.error || labels.error);
      }
    } catch {
      setStatus('error');
      setErrorMessage(labels.error);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-field">
        <label htmlFor="contact-name">{labels.name}</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-email">{labels.email}</label>
        <input id="contact-email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="contact-field">
        <label htmlFor="contact-message">{labels.message}</label>
        <textarea id="contact-message" name="message" rows={4} required />
      </div>

      <div className="contact-field contact-field--checkbox">
        <label className="contact-checkbox-label">
          <input type="checkbox" name="terms" required />
          <span>
            {labels.terms} <em>({labels.termsRequired})</em>
          </span>
        </label>
      </div>

      <button type="submit" className="contact-submit" disabled={status === 'loading'}>
        {status === 'loading' ? '…' : labels.submit}
      </button>

      {status === 'success' && <p className="contact-form-message contact-form-message--ok">{labels.success}</p>}
      {status === 'error' && (
        <p className="contact-form-message contact-form-message--error">{errorMessage}</p>
      )}
    </form>
  );
}
