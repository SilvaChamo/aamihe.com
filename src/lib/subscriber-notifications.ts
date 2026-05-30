import { randomUUID } from 'node:crypto';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import { findUserByLogin } from '@/lib/users';

export type SubscriberNotificationType = 'document_approved' | 'document_revision';

export type SubscriberNotification = {
  id: string;
  user_id: string;
  document_id: string;
  type: SubscriberNotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

async function resolveUserId(doc: SiteDocumentRecord): Promise<string | null> {
  if (doc.user_id) return doc.user_id;
  const email = String(doc.email || '').trim();
  if (!email) return null;
  const user = await findUserByLogin(email);
  return user?.id ?? null;
}

export async function createSubscriberNotification(input: {
  doc: SiteDocumentRecord;
  type: SubscriberNotificationType;
  title: string;
  message: string;
}): Promise<void> {
  const userId = await resolveUserId(input.doc);
  if (!userId) return;

  const db = await getDashboardDb();
  const notifications = db.notifications ?? [];
  const now = new Date().toISOString();

  notifications.unshift({
    id: `notif_${randomUUID().slice(0, 8)}`,
    user_id: userId,
    document_id: input.doc.id,
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    created_at: now,
  });

  db.notifications = notifications.slice(0, 500);
  await saveDashboardDb(db);
}

export async function createDocumentApprovedNotification(
  doc: SiteDocumentRecord,
  adminMessage?: string,
): Promise<void> {
  const title = doc.title_pt || 'Documento';
  const defaultMessage = `O seu documento «${title}» foi aprovado pela comissão científica.`;
  await createSubscriberNotification({
    doc,
    type: 'document_approved',
    title: 'Documento aprovado',
    message: adminMessage?.trim() || defaultMessage,
  });
}

export async function createDocumentRevisionNotification(
  doc: SiteDocumentRecord,
  comment: string,
): Promise<void> {
  const title = doc.title_pt || 'Documento';
  await createSubscriberNotification({
    doc,
    type: 'document_revision',
    title: 'Documento devolvido para edição',
    message: `O documento «${title}» necessita de alterações.\n\nComentário da comissão:\n${comment}`,
  });
}

export function listNotificationsForUser(
  notifications: SubscriberNotification[],
  userId: string,
) {
  return notifications
    .filter((item) => item.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function countUnreadForUser(
  notifications: SubscriberNotification[],
  userId: string,
) {
  return notifications.filter((item) => item.user_id === userId && !item.read).length;
}
