import type { SubscriberNotification } from '@/lib/subscriber-notifications';

const CACHE_KEY = 'aamihe_notifications_v1';

export type NotificationCachePayload = {
  notifications: SubscriberNotification[];
  unread: number;
  fetchedAt: number;
};

type CacheListener = () => void;
const listeners = new Set<CacheListener>();

export function subscribeNotificationCache(listener: CacheListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitNotificationCacheChange() {
  listeners.forEach((listener) => listener());
}

export function readNotificationCache(): NotificationCachePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotificationCachePayload;
    if (!Array.isArray(parsed.notifications)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeNotificationCache(payload: NotificationCachePayload): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    emitNotificationCacheChange();
  } catch {
    /* quota / private mode */
  }
}

export function patchNotificationRead(id: string): void {
  const cache = readNotificationCache();
  if (!cache) return;
  const notifications = cache.notifications.map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
  writeNotificationCache({
    notifications,
    unread: notifications.filter((item) => !item.read).length,
    fetchedAt: Date.now(),
  });
}

export function patchAllNotificationsRead(): void {
  const cache = readNotificationCache();
  if (!cache) return;
  const notifications = cache.notifications.map((item) => ({ ...item, read: true }));
  writeNotificationCache({
    notifications,
    unread: 0,
    fetchedAt: Date.now(),
  });
}

export function readCachedUnreadCount(): number {
  return readNotificationCache()?.unread ?? 0;
}
