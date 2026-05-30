'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import FormAntiSpam from '@/components/FormAntiSpam';
import { validateSpamFromForm } from '@/lib/form-spam-guard';
import { adminFetch } from '@/lib/admin-auth';
import { useLanguage } from '@/context/LanguageContext';
import { conferenceFormExtra } from '@/i18n/messages';
import {
  CONFERENCE_FILE_ACCEPT,
  CONFERENCE_MAX_FILES,
  getFileTypeLabel,
} from '@/lib/conference-document-files';
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
  intro: 'Envie um ou vários documentos (PDF, Word, Excel, PowerPoint e outros formatos comuns) para avaliação.',
  name: 'Nome',
  email: 'E-mail',
  message: 'Mensagem',
  file: 'Documentos',
  filePlaceholder: 'Seleccionar ficheiros',
  terms: 'Aceito os termos e condições',
  security: 'Segurança',
  submit: 'Enviar documentos',
  submitting: 'A enviar...',
  success: 'Documento(s) enviado(s) com sucesso. Será(ão) publicado(s) após revisão.',
  error: 'Erro ao enviar documento. Tente novamente.',
};

export default function ConferenceSubmissionForm({
  onSubmitted,
  labels = DEFAULT_LABELS,
  defaultName = '',
  defaultEmail = '',
  authenticated = false,
}: ConferenceSubmissionFormProps) {
  const { locale } = useLanguage();
  const extra = conferenceFormExtra[locale];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formKey, setFormKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    if (list.length > CONFERENCE_MAX_FILES) {
      setError(extra.maxFilesError(CONFERENCE_MAX_FILES));
      e.target.value = '';
      return;
    }
    setError('');
    setSelectedFiles(list);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return next;
    });
  }

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

    if (selectedFiles.length === 0) {
      setError(extra.selectAtLeastOne);
      setLoading(false);
      return;
    }

    const data = new FormData(form);
    data.delete('files');
    selectedFiles.forEach((file) => data.append('files', file));
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
      setSelectedFiles([]);
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

        <label>
          {labels.file} * <span className="conference-form-hint">({extra.maxFilesHint} {CONFERENCE_MAX_FILES})</span>
          {authenticated ? (
            <div className="subscriber-doc-upload-box">
              <Upload size={18} />
              <input
                ref={fileInputRef}
                type="file"
                name="files"
                accept={CONFERENCE_FILE_ACCEPT}
                multiple
                onChange={handleFilesChange}
              />
              <span>
                {selectedFiles.length > 0
                  ? selectedFiles.map((file) => file.name).join(', ')
                  : labels.filePlaceholder}
              </span>
            </div>
          ) : (
            <div className="conference-form-upload-box">
              <Upload size={20} />
              <input
                ref={fileInputRef}
                type="file"
                name="files"
                accept={CONFERENCE_FILE_ACCEPT}
                multiple
                onChange={handleFilesChange}
              />
              <span>
                {selectedFiles.length > 0
                  ? extra.filesSelected(selectedFiles.length)
                  : labels.filePlaceholder}
              </span>
            </div>
          )}
        </label>

        {selectedFiles.length > 0 ? (
          <ul className="conference-form-file-list">
            {selectedFiles.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span>
                  {file.name}{' '}
                  <em>({getFileTypeLabel(file.name)}, {(file.size / 1024 / 1024).toFixed(1)} MB)</em>
                </span>
                <button
                  type="button"
                  className="conference-form-file-remove"
                  onClick={() => removeFile(index)}
                  aria-label={extra.removeFile(file.name)}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="conference-form-formats">
          {authenticated ? extra.formatsAuth : extra.formatsPublic}
        </p>

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
