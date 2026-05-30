'use client';

import { use } from 'react';
import SubscriberDocumentEditPage from '@/components/Admin/SubscriberDocumentEditPage';

export default function EditarDocumentoSubscritorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SubscriberDocumentEditPage id={id} />;
}
