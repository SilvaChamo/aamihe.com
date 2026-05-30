import type { SiteDocumentRecord } from '@/lib/site-documents';

export type DocumentReviewStatus = 'submitted' | 'approved' | 'revision_requested';

export function getDocumentReviewStatus(doc: SiteDocumentRecord): DocumentReviewStatus {
  if (doc.review_status) return doc.review_status;
  if (doc.published) return 'approved';
  return 'submitted';
}

export function getSubscriberStatusLabel(doc: SiteDocumentRecord): string {
  const status = getDocumentReviewStatus(doc);
  if (status === 'approved') return 'Aprovado';
  if (status === 'revision_requested') return 'Por editar';
  return 'Enviado';
}

export function getAdminStatusLabel(doc: SiteDocumentRecord): string {
  const status = getDocumentReviewStatus(doc);
  if (status === 'approved') return 'Aprovado';
  if (status === 'revision_requested') return 'Devolvido';
  return 'Pendente';
}

export function getStatusBadgeClass(
  doc: SiteDocumentRecord,
  view: 'subscriber' | 'admin',
): string {
  const status = getDocumentReviewStatus(doc);
  if (status === 'approved') return 'published';
  if (status === 'revision_requested') return view === 'admin' ? 'revision' : 'revision';
  return view === 'admin' ? 'pending' : 'sent';
}
