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

const formCopy = {
  pt: {
    titleAdd: 'Adicionar nova notícia',
    titleEdit: 'Editar notícia',
    editingIn: 'A editar em:',
    translationNote: ' (versão traduzida; o português é a língua principal do site)',
    placeholderTitle: 'Adicionar título',
    placeholderContent: 'Escreva o conteúdo da notícia aqui...',
    panelExcerpt: 'Excerto (Resumo)',
    placeholderSummary: 'Uma breve descrição para a Home Page...',
    panelFeaturedImage: 'Imagem de destaque',
    featuredImageAria: 'Imagem de destaque',
    featuredImageBtn: 'Imagem de destaque',
    removeImage: 'Remover imagem',
    panelPublish: 'Publicar',
    statusLabel: 'Estado:',
    published: 'Publicado',
    draft: 'Rascunho',
    visibilityLabel: 'Visibilidade:',
    public: 'Público',
    dateLabel: 'Data:',
    moveToTrash: 'Mover para o lixo',
    saving: 'A guardar...',
    update: 'Atualizar',
    publish: 'Publicar',
    panelCategories: 'Categorias',
    errSave: 'Erro ao guardar notícia',
  },
  fr: {
    titleAdd: 'Ajouter une actualité',
    titleEdit: "Modifier l'actualité",
    editingIn: 'Édition en :',
    translationNote: ' (version traduite ; le portugais est la langue principale du site)',
    placeholderTitle: 'Ajouter un titre',
    placeholderContent: "Écrivez le contenu de l'actualité ici...",
    panelExcerpt: 'Extrait (Résumé)',
    placeholderSummary: "Une brève description pour la page d'accueil...",
    panelFeaturedImage: 'Image mise en avant',
    featuredImageAria: 'Image mise en avant',
    featuredImageBtn: 'Image mise en avant',
    removeImage: "Supprimer l'image",
    panelPublish: 'Publier',
    statusLabel: 'État :',
    published: 'Publié',
    draft: 'Brouillon',
    visibilityLabel: 'Visibilité :',
    public: 'Public',
    dateLabel: 'Date :',
    moveToTrash: 'Mettre à la corbeille',
    saving: 'Enregistrement...',
    update: 'Mettre à jour',
    publish: 'Publier',
    panelCategories: 'Catégories',
    errSave: "Erreur lors de l'enregistrement",
  },
  en: {
    titleAdd: 'Add new news',
    titleEdit: 'Edit news',
    editingIn: 'Editing in:',
    translationNote: ' (translated version; Portuguese is the site\'s main language)',
    placeholderTitle: 'Add title',
    placeholderContent: 'Write the news content here...',
    panelExcerpt: 'Excerpt (Summary)',
    placeholderSummary: 'A brief description for the Home Page...',
    panelFeaturedImage: 'Featured image',
    featuredImageAria: 'Featured image',
    featuredImageBtn: 'Featured image',
    removeImage: 'Remove image',
    panelPublish: 'Publish',
    statusLabel: 'Status:',
    published: 'Published',
    draft: 'Draft',
    visibilityLabel: 'Visibility:',
    public: 'Public',
    dateLabel: 'Date:',
    moveToTrash: 'Move to trash',
    saving: 'Saving...',
    update: 'Update',
    publish: 'Publish',
    panelCategories: 'Categories',
    errSave: 'Error saving news',
  },
} as const;

export default function NewsForm({ initialData, isEdit = false }: NewsFormProps) {
  const router = useRouter();
  const base = useAdminBase();
  const { locale } = useLanguage();
  const f = formCopy[locale];
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
      alert(err instanceof Error ? err.message : f.errSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-form-container">
      <div className="news-form-header">
        <h1>{isEdit ? f.titleEdit : f.titleAdd}</h1>
        <p className="news-form-locale-hint">
          {f.editingIn} <strong>{localeLabels[locale]}</strong>
          {locale !== 'pt' ? f.translationNote : ''}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="news-form-layout">
        <div className="news-form-main">
          <input
            type="text"
            placeholder={f.placeholderTitle}
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
              placeholder={f.placeholderContent}
            />
          </div>

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>{f.panelExcerpt}</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              <textarea
                className="news-form-textarea"
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder={f.placeholderSummary}
              />
            </div>
          </div>
        </div>

        <div className="news-form-sidebar">
          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>{f.panelFeaturedImage}</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              {formData.image ? (
                <div className="news-form-image-block">
                  <button
                    type="button"
                    className="news-form-image-trigger"
                    onClick={openFeaturedImagePicker}
                    aria-label={f.featuredImageAria}
                  >
                    <img src={formData.image} alt="" className="news-form-image-preview" />
                  </button>
                  <button
                    type="button"
                    className="news-form-link news-form-link-danger"
                    onClick={() => applyFeaturedImage('')}
                  >
                    {f.removeImage}
                  </button>
                </div>
              ) : (
                <button type="button" className="news-form-link" onClick={openFeaturedImagePicker}>
                  {f.featuredImageBtn}
                </button>
              )}
            </div>
          </div>

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>{f.panelPublish}</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              <div className="news-form-meta">
                <div className="news-form-meta-row">
                  <Key size={16} />
                  <span>{f.statusLabel} <strong>{formData.status === 'published' ? f.published : f.draft}</strong></span>
                </div>
                <div className="news-form-meta-row">
                  <Eye size={16} />
                  <span>{f.visibilityLabel} <strong>{f.public}</strong></span>
                </div>
                <div className="news-form-meta-row">
                  <Calendar size={16} />
                  <span>{f.dateLabel} <strong>{formData.date}</strong></span>
                </div>
              </div>
            </div>
            <div className="news-form-panel-footer">
              <button type="button" className="news-form-link news-form-link-danger" onClick={() => router.push(`${base}/noticias`)}>
                {f.moveToTrash}
              </button>
              <button type="submit" className="news-form-submit" disabled={loading}>
                {loading ? f.saving : (isEdit ? f.update : f.publish)}
              </button>
            </div>
          </div>

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>{f.panelCategories}</h2>
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
