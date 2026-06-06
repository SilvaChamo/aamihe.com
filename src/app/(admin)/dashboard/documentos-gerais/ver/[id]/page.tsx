'use client';

import { use } from 'react';
import ConferenceDocumentReviewPage from '@/components/Admin/ConferenceDocumentReviewPage';

export default function VerDocumentoAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ConferenceDocumentReviewPage id={id} listPath="/dashboard/documentos-gerais" />
  );
}
