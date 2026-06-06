'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import '@/components/Admin/DocumentForm.css';
import { useAdminBase } from '@/lib/admin-base';

type DocumentFormProps = {
  initialData?: {
    id: string;
    title_pt: string;
    title_en?: string | null;
    title_fr?: string | null;
    file_url: string;
    language: 'pt' | 'en' | 'fr';
    author?: string;
    year?: string;
    published: boolean;
  };
  isEdit?: boolean;
};

export default function DocumentForm({ initialData, isEdit = false }: DocumentFormProps) {
  const router = useRouter();
  const base = useAdminBase();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title_pt: initialData?.title_pt || '',
    title_en: initialData?.title_en || '',
    title_fr: initialData?.title_fr || '',
    language: initialData?.language || 'pt',
    author: initialData?.author || '',
    year: initialData?.year || '',
    published: initialData?.published ?? true,
    file_url: initialData?.file_url || '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title_pt: initialData.title_pt,
        title_en: initialData.title_en || '',
        title_fr: initialData.title_fr || '',
        language: initialData.language,
        author: initialData.author || '',
        year: initialData.year || '',
        published: initialData.published,
        file_url: initialData.file_url,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && initialData?.id) {
        const res = await fetch('/api/admin/documents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, id: initialData.id }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else {
        const body = new FormData();
        body.append('title_pt', form.title_pt);
        if (form.title_en) body.append('title_en', form.title_en);
        if (form.title_fr) body.append('title_fr', form.title_fr);
        body.append('language', form.language);
        if (form.author) body.append('author', form.author);
        if (form.year) body.append('year', form.year);
        body.append('published', String(form.published));
        if (file) {
          body.append('file', file);
        } else if (form.file_url) {
          const res = await fetch('/api/admin/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
          router.push(`${base}/documentos-gerais`);
          return;
        } else {
          alert('Seleccione um ficheiro PDF.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/admin/documents', { method: 'POST', body });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }

      router.push(`${base}/documentos-gerais`);
    } catch (error) {
      console.error(error);
      alert('Erro ao guardar documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-form-page">
      <Link href={`${base}/documentos-gerais`} className="document-form-back">
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <h1 className="document-form-title">
        {isEdit ? 'Editar documento da conferência' : 'Novo documento da conferência'}
      </h1>
      <p className="document-form-intro">
        Carregue o PDF do programa, resumo ou apresentação submetida na conferência.
      </p>

      <form onSubmit={handleSubmit} className="document-form">
        <div className="document-form-grid">
          <label>
            Título (PT) *
            <input
              required
              value={form.title_pt}
              onChange={(e) => setForm({ ...form, title_pt: e.target.value })}
            />
          </label>
          <label>
            Título (EN)
            <input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </label>
          <label>
            Título (FR)
            <input value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} />
          </label>
          <label>
            Autor
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </label>
          <label>
            Ano
            <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </label>
          <label>
            Idioma principal
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as 'pt' | 'en' | 'fr' })}>
              <option value="pt">Português</option>
              <option value="en">Inglês</option>
              <option value="fr">Francês</option>
            </select>
          </label>
        </div>

        {!isEdit && (
          <label className="document-form-upload">
            <span>Ficheiro PDF *</span>
            <div className="document-form-upload-box">
              <Upload size={20} />
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <span>{file ? file.name : 'Seleccionar PDF'}</span>
            </div>
          </label>
        )}

        {isEdit && form.file_url && (
          <p className="document-form-current-file">
            Ficheiro actual: <a href={form.file_url} target="_blank" rel="noopener noreferrer">{form.file_url}</a>
          </p>
        )}

        <label className="document-form-checkbox">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
          />
          Publicar no site
        </label>

        <div className="document-form-actions">
          <button type="submit" disabled={loading} className="document-form-submit">
            {loading ? 'A guardar...' : isEdit ? 'Actualizar' : 'Guardar documento'}
          </button>
        </div>
      </form>
    </div>
  );
}
