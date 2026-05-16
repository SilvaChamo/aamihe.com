'use client';

import React, { use } from 'react';
import NewsForm from '@/components/Admin/NewsForm';
import { useNews } from '@/context/NewsContext';

export default function EditarNoticiaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { getNewsById } = useNews();
  const newsItem = getNewsById(parseInt(resolvedParams.id));

  if (!newsItem) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Notícia não encontrada</h2>
        <p>A notícia que procura não existe ou foi eliminada.</p>
      </div>
    );
  }

  return <NewsForm initialData={newsItem} isEdit={true} />;
}
