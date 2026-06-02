'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-auth';
import type { SubscriberNotification } from '@/lib/subscriber-notifications';
import {
  isNotificationCacheFresh,
  NOTIFICATION_CACHE_TTL_MS,
  patchAllNotificationsRead,
  patchNotificationRead,
  readNotificationCache,
  subscribeNotificationCache,
  writeNotificationCache,
} from '@/lib/notification-client-cache';

type UseSubscriberNotificationsResult = {
  notifications: SubscriberNotification[];
  unread: number;
  ready: boolean;
  refreshing: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  marking: boolean;
};

export function useSubscriberNotifications(): UseSubscriberNotificationsResult {
  const initialCache = readNotificationCache();
  const cacheIsFresh = isNotificationCacheFresh();

  const [notifications, setNotifications] = useState<SubscriberNotification[]>(
    initialCache?.notifications ?? [],
  );
  const [unread, setUnread] = useState(initialCache?.unread ?? 0);
  const [ready, setReady] = useState(Boolean(initialCache));
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);

  const applyCache = useCallback(() => {
    const cache = readNotificationCache();
    if (!cache) return;
    setNotifications(cache.notifications);
    setUnread(cache.unread);
    setReady(true);
  }, []);

  const refresh = useCallback(async (background = false) => {
    if (background) {
      setRefreshing(true);
    }

    try {
      const res = await adminFetch('/api/admin/notifications/mine', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        const list = (data.notifications ?? []) as SubscriberNotification[];
        setNotifications(list);
        setUnread(data.unread ?? 0);
        writeNotificationCache({
          notifications: list,
          unread: data.unread ?? 0,
          fetchedAt: Date.now(),
        });
      }
    } catch {
      /* mantém cache */
    } finally {
      setReady(true);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    applyCache();
    if (!cacheIsFresh) {
      void refresh(false);
    } else {
      setReady(true);
    }
    return subscribeNotificationCache(applyCache);
  }, [applyCache, cacheIsFresh, refresh]);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    patchNotificationRead(id);

    try {
      await adminFetch('/api/admin/notifications/mine', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      void refresh(true);
    }
  }

  async function markAllRead() {
    setMarking(true);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnread(0);
    patchAllNotificationsRead();

    try {
      await adminFetch('/api/admin/notifications/mine', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {
      void refresh(true);
    } finally {
      setMarking(false);
    }
  }

  return { notifications, unread, ready, refreshing, markRead, markAllRead, marking };
}

export { NOTIFICATION_CACHE_TTL_MS };
