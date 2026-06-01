'use client';

import MediaLibrarySection from '@/components/Admin/MediaLibrarySection';
import '../media.css';

export default function AdminMediaVideosPage() {
  return <MediaLibrarySection title="Vídeos do site" initialCategory="videos" />;
}
