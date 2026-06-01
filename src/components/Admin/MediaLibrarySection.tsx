'use client';

import MediaLibrary from '@/components/Admin/MediaLibrary';
import type { MediaCategory } from '@/lib/site-media';

type MediaLibrarySectionProps = {
  title: string;
  initialCategory: MediaCategory;
};

export default function MediaLibrarySection({ title, initialCategory }: MediaLibrarySectionProps) {
  return (
    <div className="media-page">
      <div className="media-header">
        <h1 className="media-title">{title}</h1>
      </div>
      <MediaLibrary initialCategory={initialCategory} />
    </div>
  );
}
