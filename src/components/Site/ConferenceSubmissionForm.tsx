'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import FormAntiSpam from '@/components/FormAntiSpam';
import { validateSpamFromForm } from '@/lib/form-spam-guard';
import './ConferenceSubmissionForm.css';

type ConferenceSubmissionFormProps = {
  onSubmitted?: () => void;
};

export default function ConferenceSubmissionForm({ onSubmitted }: ConferenceSubmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const form = e.currentTarget;
    const spam = validateSpamFromForm(form);
    if (!spam.ok) {
      setError(spam.error);
      setLoading(false);
      return;
    }
    const data = new FormData(form);
    const file = data.get('file') as File | null;

    if (file) {
      data.set('file', file);
    }

    data.set('accepted', String((form.elements.namedItem('accepted') as HTMLInputElement)?.checked));

    try {
      const res = await fetch('/api/public/conferencia-submissions', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Erro ao enviar.');
        return;
      }

      setSuccess(result.message);
      setFileName('');
      setFormKey((k) => k + 1);
      onSubmitted?.();
    } catch {
      setError('Erro ao enviar documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="conference-form-section">
      <h2 className="conference-form-title">Submissão de documentos</h2>
      <p className="conference-form-intro">
        Preencha o formulário e envie o seu resumo ou documento em formato PDF para avaliação.
      </p>

      <form key={formKey} className="conference-form" onSubmit={handleSubmit}>
        <label>
          Nome *
          <input type="text" name="name" required />
        </label>

        <label>
          E-mail *
          <input type="email" name="email" required />
        </label>

        <label>
          Mensagem
          <textarea name="message" rows={4} />
        </label>

        <label className="conference-form-upload">
          Enviar documento (PDF) *
          <div className="conference-form-upload-box">
            <Upload size={20} />
            <input
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
            <span>{fileName || 'Seleccionar PDF'}</span>
          </div>
        </label>

        <label className="conference-form-checkbox">
          <input type="checkbox" name="accepted" required />
          Aceito os termos e condições *
        </label>

        <FormAntiSpam mathLabel="Segurança" />

        {error && <p className="conference-form-error">{error}</p>}
        {success && <p className="conference-form-success">{success}</p>}

        <button type="submit" disabled={loading} className="conference-form-submit">
          {loading ? 'A enviar...' : 'Enviar documento'}
        </button>
      </form>
    </section>
  );
}
