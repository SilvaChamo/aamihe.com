'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import FormAntiSpam from '@/components/FormAntiSpam';
import { validateSpamFromForm } from '@/lib/form-spam-guard';
import { adminFetch } from '@/lib/admin-auth';
import './ConferenceSubmissionForm.css';

type ConferenceFormLabels = {
  title: string;
  intro: string;
  name: string;
  email: string;
  message: string;
  file: string;
  filePlaceholder: string;
  terms: string;
  security: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
};

type ConferenceSubmissionFormProps = {
  onSubmitted?: () => void;
  labels?: ConferenceFormLabels;
  defaultName?: string;
  defaultEmail?: string;
  authenticated?: boolean;
};

const DEFAULT_LABELS: ConferenceFormLabels = {
  title: 'Submissão de documentos',
  intro: 'Preencha o formulário e envie o seu resumo ou documento em formato PDF para avaliação.',
  name: 'Nome',
  email: 'E-mail',
  message: 'Mensagem',
  file: 'Enviar documento (PDF)',
  filePlaceholder: 'Seleccionar PDF',
  terms: 'Aceito os termos e condições',
  security: 'Segurança',
  submit: 'Enviar documento',
  submitting: 'A enviar...',
  success: 'Documento enviado com sucesso. Será publicado após revisão.',
  error: 'Erro ao enviar documento. Tente novamente.',
};

export default function ConferenceSubmissionForm({
  onSubmitted,
  labels = DEFAULT_LABELS,
  defaultName = '',
  defaultEmail = '',
  authenticated = false,
}: ConferenceSubmissionFormProps) {
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
      const submit = authenticated ? adminFetch : fetch;
      const res = await submit('/api/public/conferencia-submissions', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || labels.error);
        return;
      }

      setSuccess(result.message || labels.success);
      setFileName('');
      setFormKey((k) => k + 1);
      onSubmitted?.();
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="conference-form-section">
      <h2 className="conference-form-title">{labels.title}</h2>
      <p className="conference-form-intro">{labels.intro}</p>

      <form key={formKey} className="conference-form" onSubmit={handleSubmit}>
        <label>
          {labels.name} *
          <input type="text" name="name" defaultValue={defaultName} required />
        </label>

        <label>
          {labels.email} *
          <input
            type="email"
            name="email"
            defaultValue={defaultEmail}
            readOnly={authenticated}
            required
          />
        </label>

        <label>
          {labels.message}
          <textarea name="message" rows={4} />
        </label>

        <label className="conference-form-upload">
          {labels.file} *
          <div className="conference-form-upload-box">
            <Upload size={20} />
            <input
              type="file"
              name="file"
              accept="application/pdf,.pdf"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
            <span>{fileName || labels.filePlaceholder}</span>
          </div>
        </label>

        <label className="conference-form-checkbox">
          <input type="checkbox" name="accepted" required />
          {labels.terms} *
        </label>

        <FormAntiSpam mathLabel={labels.security} />

        {error && <p className="conference-form-error">{error}</p>}
        {success && <p className="conference-form-success">{success}</p>}

        <button type="submit" disabled={loading} className="conference-form-submit">
          {loading ? labels.submitting : labels.submit}
        </button>
      </form>
    </section>
  );
}
