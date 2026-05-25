'use client';

import React from 'react';
import MediaLibrary from '@/components/Admin/MediaLibrary';

export default function GalleryPage() {
  return (
    <div className="media-page">
      <div className="media-header">
        <h1 className="media-title">Galeria</h1>
      </div>
      <MediaLibrary fullCatalog />
    </div>
  );
}
