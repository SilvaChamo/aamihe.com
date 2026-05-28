'use client';

import { useState, type FormEvent } from 'react';
import { submitContactForm } from '@/app/contacte-nos/actions';
import FormAntiSpam from '@/components/FormAntiSpam';

type ContactFormProps = {
  labels: {
    formTitle: string;
    firstName: string;
    lastName: string;
    contact: string;
    email: string;
    message: string;
    terms: string;
    termsRequired: string;
    mathLabel: string;
    submit: string;
    success: string;
    error: string;
  };
};

export default function ContactForm({ labels }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formKey, setFormKey] = useState(0);

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
        setFormKey((k) => k + 1);
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
    <>
      <h2 className="contact-form-heading">{labels.formTitle}</h2>
      <form key={formKey} className="contact-form" onSubmit={handleSubmit} noValidate>
        <div className="contact-form-row">
          <div className="contact-field">
            <label htmlFor="contact-first-name">{labels.firstName}</label>
            <input id="contact-first-name" name="firstName" type="text" required autoComplete="given-name" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-last-name">{labels.lastName}</label>
            <input id="contact-last-name" name="lastName" type="text" required autoComplete="family-name" />
          </div>
        </div>

        <div className="contact-form-row">
          <div className="contact-field">
            <label htmlFor="contact-phone">{labels.contact}</label>
            <input id="contact-phone" name="contact" type="tel" autoComplete="tel" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-email">{labels.email}</label>
            <input id="contact-email" name="email" type="email" required autoComplete="email" />
          </div>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">{labels.message}</label>
          <textarea id="contact-message" name="message" rows={4} required />
        </div>

        <div className="contact-form-security-row">
          <div className="contact-field contact-field--checkbox">
            <label className="contact-checkbox-label">
              <input type="checkbox" name="terms" required />
              <span>
                {labels.terms} <em>({labels.termsRequired})</em>
              </span>
            </label>
          </div>
          <FormAntiSpam mathLabel={labels.mathLabel} mathClassName="contact-math-captcha" />
        </div>

        <button type="submit" className="contact-submit" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : labels.submit}
        </button>

        {status === 'success' && (
          <p className="contact-form-message contact-form-message--ok">{labels.success}</p>
        )}
        {status === 'error' && (
          <p className="contact-form-message contact-form-message--error">{errorMessage}</p>
        )}
      </form>
    </>
  );
}
