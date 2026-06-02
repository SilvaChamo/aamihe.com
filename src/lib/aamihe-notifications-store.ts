import 'server-only';

import type { SubscriberNotification } from '@/lib/subscriber-notifications';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const TABLE = 'aamihe_subscriber_notifications';
const MAX_NOTIFICATIONS = 500;

type NotificationRow = {
  id: string;
  user_id: string;
  document_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

function admin() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase não configurado (SUPABASE_SERVICE_ROLE_KEY).');
  }
  return client;
}

function rowToNotification(row: NotificationRow): SubscriberNotification {
  return {
    id: row.id,
    user_id: row.user_id,
    document_id: row.document_id ?? '',
    type: row.type as SubscriberNotification['type'],
    title: row.title,
    message: row.message,
    read: row.read,
    created_at: row.created_at,
  };
}

export function isNotificationsStoreConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function listAllNotifications(): Promise<SubscriberNotification[]> {
  const { data, error } = await admin()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_NOTIFICATIONS);

  if (error) {
    console.error('[aamihe_subscriber_notifications] list:', error.message);
    throw new Error('Não foi possível carregar notificações.');
  }

  return ((data ?? []) as NotificationRow[]).map(rowToNotification);
}

export async function listNotificationsForUserId(userId: string): Promise<SubscriberNotification[]> {
  const { data, error } = await admin()
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_NOTIFICATIONS);

  if (error) {
    console.error('[aamihe_subscriber_notifications] listForUser:', error.message);
    throw new Error('Não foi possível carregar notificações.');
  }

  return ((data ?? []) as NotificationRow[]).map(rowToNotification);
}

export async function countUnreadForUserId(userId: string): Promise<number> {
  const { count, error } = await admin()
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('[aamihe_subscriber_notifications] countUnread:', error.message);
    return 0;
  }

  return count ?? 0;
}

export async function insertNotification(notification: SubscriberNotification): Promise<void> {
  const { error } = await admin().from(TABLE).insert({
    id: notification.id,
    user_id: notification.user_id,
    document_id: notification.document_id || null,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    created_at: notification.created_at,
  });

  if (error) {
    console.error('[aamihe_subscriber_notifications] insert:', error.message);
    throw new Error('Não foi possível criar a notificação.');
  }

  await trimOldNotifications();
}

async function trimOldNotifications(): Promise<void> {
  const { data, error } = await admin()
    .from(TABLE)
    .select('id')
    .order('created_at', { ascending: false })
    .range(MAX_NOTIFICATIONS, MAX_NOTIFICATIONS + 100);

  if (error || !data?.length) return;

  const ids = data.map((row) => row.id);
  await admin().from(TABLE).delete().in('id', ids);
}

export async function markNotificationRead(id: string, userId: string): Promise<boolean> {
  const { data, error } = await admin()
    .from(TABLE)
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[aamihe_subscriber_notifications] markRead:', error.message);
    return false;
  }

  return Boolean(data);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const { data, error } = await admin()
    .from(TABLE)
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .select('id');

  if (error) {
    console.error('[aamihe_subscriber_notifications] markAllRead:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

export async function insertNotificationsBatch(notifications: SubscriberNotification[]): Promise<void> {
  if (notifications.length === 0) return;

  const { error } = await admin().from(TABLE).upsert(
    notifications.map((n) => ({
      id: n.id,
      user_id: n.user_id,
      document_id: n.document_id || null,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      created_at: n.created_at,
    })),
    { onConflict: 'id' },
  );

  if (error) {
    console.error('[aamihe_subscriber_notifications] batch:', error.message);
    throw new Error('Não foi possível importar notificações.');
  }
}
