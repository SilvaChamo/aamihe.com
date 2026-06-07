'use client';

import React, { use } from 'react';
import NewsForm from '@/components/Admin/NewsForm';
import { useNews } from '@/context/NewsContext';
import { useLanguage } from '@/context/LanguageContext';

const notFoundCopy = {
  pt: { title: 'Notícia não encontrada', desc: 'A notícia que procura não existe ou foi eliminada.' },
  fr: { title: 'Article introuvable', desc: "L'article que vous recherchez n'existe pas ou a été supprimé." },
  en: { title: 'News not found', desc: 'The news item you are looking for does not exist or has been deleted.' },
} as const;

export default function EditarNoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { getNewsById } = useNews();
  const { locale } = useLanguage();
  const newsItem = getNewsById(parseInt(resolvedParams.id));
  const t = notFoundCopy[locale];

  if (!newsItem) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>{t.title}</h2>
        <p>{t.desc}</p>
      </div>
    );
  }

  return <NewsForm key={newsItem.id} initialData={newsItem} isEdit={true} />;
}
