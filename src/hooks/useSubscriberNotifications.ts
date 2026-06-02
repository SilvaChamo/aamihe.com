'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-auth';
import type { SubscriberNotification } from '@/lib/subscriber-notifications';
import {
  patchAllNotificationsRead,
  patchNotificationRead,
  patchNotificationsReadForDocument,
  readNotificationCache,
  subscribeNotificationCache,
  writeNotificationCache,
} from '@/lib/notification-client-cache';

type UseSubscriberNotificationsResult = {
  notifications: SubscriberNotification[];
  unread: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markReadForDocument: (documentId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  marking: boolean;
};

export function useSubscriberNotifications(): UseSubscriberNotificationsResult {
  const initialCache = readNotificationCache();
  const [notifications, setNotifications] = useState<SubscriberNotification[]>(
    initialCache?.notifications ?? [],
  );
  const [unread, setUnread] = useState(initialCache?.unread ?? 0);
  const [loading, setLoading] = useState(!initialCache);
  const [marking, setMarking] = useState(false);

  const applyCache = useCallback(() => {
    const cache = readNotificationCache();
    if (!cache) return;
    setNotifications(cache.notifications);
    setUnread(cache.unread);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyCache();
    void refresh();
    return subscribeNotificationCache(applyCache);
  }, [applyCache, refresh]);

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
      void refresh();
    }
  }

  async function markReadForDocument(documentId: string) {
    try {
      const res = await adminFetch('/api/admin/notifications/mine', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) return;

      const list = (data.notifications ?? []) as SubscriberNotification[];
      const targets = list.filter(
        (item) => !item.read && item.document_id === documentId,
      );
      if (targets.length === 0) {
        setNotifications(list);
        setUnread(data.unread ?? 0);
        writeNotificationCache({
          notifications: list,
          unread: data.unread ?? 0,
          fetchedAt: Date.now(),
        });
        return;
      }

      patchNotificationsReadForDocument(documentId);
      const updated = list.map((item) =>
        item.document_id === documentId ? { ...item, read: true } : item,
      );
      const unread = updated.filter((item) => !item.read).length;
      setNotifications(updated);
      setUnread(unread);
      writeNotificationCache({ notifications: updated, unread, fetchedAt: Date.now() });

      await Promise.all(
        targets.map((item) =>
          adminFetch('/api/admin/notifications/mine', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id }),
          }),
        ),
      );
    } catch {
      void refresh();
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
      void refresh();
    } finally {
      setMarking(false);
    }
  }

  return {
    notifications,
    unread,
    loading,
    markRead,
    markReadForDocument,
    markAllRead,
    marking,
  };
}
