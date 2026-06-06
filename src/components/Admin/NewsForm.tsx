'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useNews } from '@/context/NewsContext';
import type { NewsItem } from '@/data/news';
import { buildNewsSavePayload, readNewsFieldsForLocale } from '@/lib/news-i18n';
import { Calendar, Eye, Key, ChevronUp } from 'lucide-react';
import VisualEditor from './VisualEditor';
import MediaModal from './MediaModal';
import { persistNewsImage } from '@/lib/persist-client-media';
import { useAdminBase } from '@/lib/admin-base';
import './NewsForm.css';

interface NewsFormProps {
  initialData?: any;
  isEdit?: boolean;
}

const localeLabels = { pt: 'Português', fr: 'Français', en: 'English' } as const;

export default function NewsForm({ initialData, isEdit = false }: NewsFormProps) {
  const router = useRouter();
  const base = useAdminBase();
  const { locale } = useLanguage();
  const { addNews, updateNews, categories, getNewsById } = useNews();
  const [loading, setLoading] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const initializedRef = useRef<number | 'new' | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: new Date().toLocaleDateString('pt-PT'),
    image: '',
    content: '',
    summary: '',
    status: 'published' as const
  });

  useEffect(() => {
    if (initialData?.id != null) {
      const fields = readNewsFieldsForLocale(initialData as NewsItem, locale);
      setFormData({
        title: fields.title,
        category: fields.category || initialData.category || '',
        date: initialData.date || new Date().toLocaleDateString('pt-PT'),
        image: initialData.image || '',
        content: fields.content,
        summary: fields.summary,
        status: initialData.status || 'published',
      });
      initializedRef.current = initialData.id;
      return;
    }

    if (!isEdit && initializedRef.current !== 'new') {
      initializedRef.current = 'new';
    }
  }, [initialData, isEdit, locale]);

  useEffect(() => {
    if (!isEdit && categories.length > 0) {
      setFormData((prev) => ({
        ...prev,
        category: prev.category || categories[0].name,
      }));
    }
  }, [categories, isEdit]);

  const applyFeaturedImage = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }));
  };

  const openFeaturedImagePicker = () => {
    setIsMediaModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image = formData.image.trim();
      if (image && !image.startsWith('http://') && !image.startsWith('https://')) {
        image = await persistNewsImage(image, formData.title);
      }
      const existing = isEdit && initialData?.id ? getNewsById(initialData.id) : undefined;
      const payload = buildNewsSavePayload(existing, locale, {
        ...formData,
        image,
        status: formData.status,
      });

      if (isEdit && initialData?.id) {
        updateNews(initialData.id, payload);
      } else {
        addNews(payload as Omit<NewsItem, 'id'>);
      }
      router.push(`${base}/noticias`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao guardar notícia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-form-container">
      <div className="news-form-header">
        <h1>{isEdit ? 'Editar notícia' : 'Adicionar nova notícia'}</h1>
        <p className="news-form-locale-hint">
          A editar em: <strong>{localeLabels[locale]}</strong>
          {locale !== 'pt' ? ' (versão traduzida; o português é a língua principal do site)' : ''}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="news-form-layout">
        <div className="news-form-main">
          <input
            type="text"
            placeholder="Adicionar título"
            className="news-form-title-input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="news-form-editor-box">
            <VisualEditor
              key={initialData?.id || 'new'}
              value={formData.content}
              onChange={(val) => setFormData({ ...formData, content: val })}
              placeholder="Escreva o conteúdo da notícia aqui..."
            />
          </div>

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>Excerto (Resumo)</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              <textarea
                className="news-form-textarea"
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Uma breve descrição para a Home Page..."
              />
            </div>
          </div>
        </div>

        <div className="news-form-sidebar">
          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>Imagem de destaque</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              {formData.image ? (
                <div className="news-form-image-block">
                  <button
                    type="button"
                    className="news-form-image-trigger"
                    onClick={openFeaturedImagePicker}
                    aria-label="Imagem de destaque"
                  >
                    <img
                      src={formData.image}
                      alt=""
                      className="news-form-image-preview"
                    />
                  </button>
                  <button
                    type="button"
                    className="news-form-link news-form-link-danger"
                    onClick={() => applyFeaturedImage('')}
                  >
                    Remover imagem
                  </button>
                </div>
              ) : (
                <button type="button" className="news-form-link" onClick={openFeaturedImagePicker}>
                  Imagem de destaque
                </button>
              )}
            </div>
          </div>

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>Publicar</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              <div className="news-form-meta">
                <div className="news-form-meta-row">
                  <Key size={16} />
                  <span>Estado: <strong>{formData.status === 'published' ? 'Publicado' : 'Rascunho'}</strong></span>
                </div>
                <div className="news-form-meta-row">
                  <Eye size={16} />
                  <span>Visibilidade: <strong>Público</strong></span>
                </div>
                <div className="news-form-meta-row">
                  <Calendar size={16} />
                  <span>Data: <strong>{formData.date}</strong></span>
                </div>
              </div>
            </div>
            <div className="news-form-panel-footer">
              <button type="button" className="news-form-link news-form-link-danger" onClick={() => router.push(`${base}/noticias`)}>
                Mover para o lixo
              </button>
              <button type="submit" className="news-form-submit" disabled={loading}>
                {loading ? 'A guardar...' : (isEdit ? 'Atualizar' : 'Publicar')}
              </button>
            </div>
          </div>

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>Categorias</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body news-form-panel-body--categories">
              <div className="news-form-categories">
                {categories.map((cat) => (
                  <label key={cat.slug} className="news-form-category-item">
                    <input
                      type="checkbox"
                      checked={formData.category === cat.name}
                      onChange={() => setFormData({ ...formData, category: cat.name })}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          applyFeaturedImage(url);
          setIsMediaModalOpen(false);
        }}
      />
    </div>
  );
}
