import 'server-only';

import type { SiteDocumentRecord } from '@/lib/site-documents';
import { notifySiteEmail } from '@/lib/notify-email';
import {
  createDocumentApprovedNotification,
  createDocumentRevisionNotification,
} from '@/lib/subscriber-notifications';

export async function notifyDocumentRevisionRequested(
  doc: SiteDocumentRecord,
  comment: string,
): Promise<void> {
  const email = String(doc.email || '').trim();
  if (!email) return;

  await createDocumentRevisionNotification(doc, comment);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aamihe.com';
  const dashboardUrl = `${siteUrl}/dashboard/meus-documentos`;
  const notificationsUrl = `${siteUrl}/dashboard/notificacoes`;
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
    `Ver notificações: ${notificationsUrl}`,
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
      `<p><a href="${notificationsUrl}">Ver notificações</a></p>`,
      `<p><a href="${dashboardUrl}">Ver todos os documentos</a></p>`,
      '<p>Com os melhores cumprimentos,<br />AAMIHE</p>',
    ].join('\n'),
  });
}

export async function notifyDocumentApproved(
  doc: SiteDocumentRecord,
  adminMessage?: string,
): Promise<void> {
  const email = String(doc.email || '').trim();
  if (!email) return;

  await createDocumentApprovedNotification(doc, adminMessage);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aamihe.com';
  const dashboardUrl = `${siteUrl}/dashboard/meus-documentos`;
  const notificationsUrl = `${siteUrl}/dashboard/notificacoes`;
  const title = doc.title_pt || 'Documento';
  const bodyMessage =
    adminMessage?.trim() ||
    `O seu documento «${title}» foi aprovado pela comissão científica.`;

  await notifySiteEmail({
    to: email,
    subject: `Documento aprovado — ${title}`,
    text: [
      'Olá,',
      '',
      bodyMessage,
      '',
      `Ver notificações: ${notificationsUrl}`,
      `Consultar documentos: ${dashboardUrl}`,
      '',
      'Com os melhores cumprimentos,',
      'AAMIHE',
    ].join('\n'),
    html: [
      '<p>Olá,</p>',
      `<p>${bodyMessage.replace(/\n/g, '<br />')}</p>`,
      `<p><a href="${notificationsUrl}">Ver notificações</a></p>`,
      `<p><a href="${dashboardUrl}">Ver no seu painel</a></p>`,
      '<p>Com os melhores cumprimentos,<br />AAMIHE</p>',
    ].join('\n'),
  });
}
