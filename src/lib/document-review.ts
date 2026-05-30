import type { SiteDocumentRecord } from '@/lib/site-documents';
import { notifySiteEmail } from '@/lib/notify-email';

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

export async function notifyDocumentRevisionRequested(
  doc: SiteDocumentRecord,
  comment: string,
): Promise<void> {
  const email = String(doc.email || '').trim();
  if (!email) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aamihe.com';
  const dashboardUrl = `${siteUrl}/dashboard/meus-documentos`;
  const editUrl = `${siteUrl}/dashboard/meus-documentos/editar/${doc.id}`;
  const title = doc.title_pt || 'Documento';

  const text = [
    'Olá,',
    '',
    `O seu documento «${title}» foi analisado pela comissão científica e necessita de alterações.`,
    '',
    'Comentário da comissão:',
    comment,
    '',
    `Editar documento: ${editUrl}`,
    `Ver todos os documentos: ${dashboardUrl}`,
    '',
    'Com os melhores cumprimentos,',
    'AAMIHE',
  ].join('\n');

  await notifySiteEmail({
    to: email,
    subject: `Documento devolvido para edição — ${title}`,
    text,
    html: [
      '<p>Olá,</p>',
      `<p>O seu documento <strong>«${title}»</strong> foi analisado pela comissão científica e necessita de alterações.</p>`,
      '<p><strong>Comentário da comissão:</strong></p>',
      `<blockquote style="border-left:3px solid #561713;padding-left:12px;color:#50575e">${comment.replace(/\n/g, '<br />')}</blockquote>`,
      `<p><a href="${editUrl}">Editar documento</a></p>`,
      `<p><a href="${dashboardUrl}">Ver todos os documentos</a></p>`,
      '<p>Com os melhores cumprimentos,<br />AAMIHE</p>',
    ].join('\n'),
  });
}

export async function notifyDocumentApproved(doc: SiteDocumentRecord): Promise<void> {
  const email = String(doc.email || '').trim();
  if (!email) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aamihe.com';
  const dashboardUrl = `${siteUrl}/dashboard/meus-documentos`;
  const title = doc.title_pt || 'Documento';

  await notifySiteEmail({
    to: email,
    subject: `Documento aprovado — ${title}`,
    text: [
      'Olá,',
      '',
      `O seu documento «${title}» foi aprovado pela comissão científica.`,
      '',
      `Consultar: ${dashboardUrl}`,
      '',
      'Com os melhores cumprimentos,',
      'AAMIHE',
    ].join('\n'),
    html: [
      '<p>Olá,</p>',
      `<p>O seu documento <strong>«${title}»</strong> foi aprovado pela comissão científica.</p>`,
      `<p><a href="${dashboardUrl}">Ver no seu painel</a></p>`,
      '<p>Com os melhores cumprimentos,<br />AAMIHE</p>',
    ].join('\n'),
  });
}
