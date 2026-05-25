'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNews } from '@/context/NewsContext';
import { ChevronUp, Calendar, Eye, Key } from 'lucide-react';
import VisualEditor from './VisualEditor';
import MediaModal from './MediaModal';
import './NewsForm.css';

interface NewsFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function NewsForm({ initialData, isEdit = false }: NewsFormProps) {
  const router = useRouter();
  const { addNews, updateNews, categories } = useNews();
  const [loading, setLoading] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

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
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        content: initialData.content || '',
        summary: initialData.summary || ''
      }));
    } else if (categories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: prev.category || categories[0].name,
      }));
    }
  }, [initialData, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && initialData?.id) {
        updateNews(initialData.id, formData);
      } else {
        addNews(formData);
      }
      router.push('/admin/noticias');
    } catch (err) {
      console.error(err);
      alert('Erro ao guardar notícia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-form-container">
      <div className="news-form-header">
        <h1>{isEdit ? 'Editar notícia' : 'Adicionar nova notícia'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="news-form-layout">
        <div className="news-form-main">
          <input 
            type="text" 
            placeholder="Introduza o título aqui" 
            className="wp-title-input"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />

          <div className="wp-box">
            <div className="wp-box-header">
              <h2>Conteúdo Visual</h2>
            </div>
            <div className="wp-box-content" style={{ padding: 0 }}>
              <VisualEditor 
                key={initialData?.id || 'new'}
                value={formData.content}
                onChange={(val) => setFormData({...formData, content: val})}
                placeholder="Escreva o conteúdo da notícia aqui..."
              />
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-header">
              <h2>Excerto (Resumo)</h2>
              <ChevronUp size={16} />
            </div>
            <div className="wp-box-content">
              <textarea 
                className="wp-textarea" 
                rows={4}
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                placeholder="Uma breve descrição para a Home Page..."
              />
            </div>
          </div>
        </div>

        <div className="news-form-sidebar">
          {/* Publicar */}
          <div className="wp-box">
            <div className="wp-box-header">
              <h2>Publicar</h2>
              <ChevronUp size={16} />
            </div>
            <div className="wp-box-content">
              <div style={{ fontSize: '13px', color: '#50575e', marginBottom: '15px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={14} /> Estado: <strong>{formData.status === 'published' ? 'Publicado' : 'Rascunho'}</strong>
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={14} /> Visibilidade: <strong>Público</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} /> Data: <strong>{formData.date}</strong>
                </div>
              </div>
            </div>
            <div className="wp-sidebar-actions">
              <button type="button" className="btn-link danger" onClick={() => router.push('/admin/noticias')}>Mover para o lixo</button>
              <button type="submit" className="btn-publish" disabled={loading}>
                {loading ? 'A guardar...' : (isEdit ? 'Atualizar' : 'Publicar')}
              </button>
            </div>
          </div>

          {/* Imagem de Destaque */}
          <div className="wp-box">
            <div className="wp-box-header">
              <h2>Imagem de destaque</h2>
              <ChevronUp size={16} />
            </div>
            <div className="wp-box-content">
              {formData.image ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="featured-image-preview" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsMediaModalOpen(true)}
                  />
                  <div style={{ marginTop: '10px' }}>
                    <button type="button" className="btn-link" onClick={() => setIsMediaModalOpen(true)}>Substituir imagem</button>
                    <br />
                    <button type="button" className="btn-link danger" onClick={() => setFormData({...formData, image: ''})}>Remover imagem</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-link" onClick={() => setIsMediaModalOpen(true)}>Definir imagem de destaque</button>
              )}
            </div>
          </div>

          {/* Categorias */}
          <div className="wp-box">
            <div className="wp-box-header">
              <h2>Categorias</h2>
              <ChevronUp size={16} />
            </div>
            <div className="wp-box-content">
              <div className="cat-list">
                {categories.map(cat => (
                  <label key={cat.slug} className="cat-item">
                    <input 
                      type="checkbox" 
                      checked={formData.category === cat.name}
                      onChange={() => setFormData({...formData, category: cat.name})}
                    /> {cat.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Media Selector Modal */}
          <MediaModal 
            isOpen={isMediaModalOpen}
            onClose={() => setIsMediaModalOpen(false)}
            onSelect={(url) => setFormData({...formData, image: url})}
          />
        </div>
      </form>
    </div>

  );
}
