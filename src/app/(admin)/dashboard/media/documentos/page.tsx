'use client';

import MediaLibrarySection from '@/components/Admin/MediaLibrarySection';
import '../media.css';

export default function AdminMediaDocumentsPage() {
  return <MediaLibrarySection title="Documentos do site" initialCategory="documentos" />;
}
