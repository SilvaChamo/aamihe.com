'use client';

import { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import MediaLibrary from '@/components/Admin/MediaLibrary';
import type { MediaCategory } from '@/lib/site-media';
import { useLanguage } from '@/context/LanguageContext';
import { adminMediaCopy, tMessages } from '@/i18n/messages';

type MediaLibrarySectionProps = {
  initialCategory: MediaCategory;
};

function pageTitleFor(
  category: MediaCategory,
  copy: (typeof adminMediaCopy)[keyof typeof adminMediaCopy],
): string {
  if (category === 'documentos') return copy.pageTitleDocuments;
  if (category === 'videos') return copy.pageTitleVideos;
  return copy.pageTitleLibrary;
}

export default function MediaLibrarySection({ initialCategory }: MediaLibrarySectionProps) {
  const { locale } = useLanguage();
  const t = tMessages(adminMediaCopy, locale);
  const [libraryView, setLibraryView] = useState<'library' | 'trash'>('library');

  return (
    <div className="media-page">
      <div className="media-header">
        <h1 className="media-title">
          {libraryView === 'trash' ? t.recycleTitle : pageTitleFor(initialCategory, t)}
        </h1>
        <div className="media-header-actions">
          {libraryView === 'trash' ? (
            <button
              type="button"
              className="media-back-button"
              onClick={() => setLibraryView('library')}
            >
              <ArrowLeft className="media-back-button-icon" aria-hidden />
              {t.backToLibrary}
            </button>
          ) : (
            <button
              type="button"
              className="media-trash-toggle"
              onClick={() => setLibraryView('trash')}
              aria-label={t.viewTrashAria}
              title={t.viewTrash}
            >
              <Trash2 className="media-trash-toggle-icon" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <MediaLibrary
        initialCategory={initialCategory}
        libraryView={libraryView}
        onLibraryViewChange={setLibraryView}
      />
    </div>
  );
}
