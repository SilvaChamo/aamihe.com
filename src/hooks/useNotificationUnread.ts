'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { adminFetch } from '@/lib/admin-auth';
import {
  isNotificationCacheFresh,
  readCachedUnreadCount,
  readNotificationCache,
  subscribeNotificationCache,
  writeNotificationCache,
} from '@/lib/notification-client-cache';

export function useNotificationUnread(enabled = true) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(readCachedUnreadCount);

  const syncFromCache = useCallback(() => {
    setUnread(readCachedUnreadCount());
  }, []);

  useEffect(() => {
    syncFromCache();
    return subscribeNotificationCache(syncFromCache);
  }, [syncFromCache]);

  useEffect(() => {
    if (!enabled) {
      setUnread(0);
      return;
    }

    if (isNotificationCacheFresh()) {
      setUnread(readCachedUnreadCount());
      return;
    }

    let cancelled = false;

    (async () => {
      const cache = readNotificationCache();
      if (cache) {
        setUnread(cache.unread);
      }

      try {
        const res = await adminFetch('/api/admin/notifications/mine?countOnly=1', {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setUnread(data.unread ?? 0);
          writeNotificationCache({
            notifications: cache?.notifications ?? [],
            unread: data.unread ?? 0,
            fetchedAt: Date.now(),
          });
        }
      } catch {
        if (!cancelled && !cache) setUnread(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, enabled]);

  return unread;
}
