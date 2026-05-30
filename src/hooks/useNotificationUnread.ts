'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { adminFetch } from '@/lib/admin-auth';
import {
  readCachedUnreadCount,
  readNotificationCache,
  subscribeNotificationCache,
  writeNotificationCache,
} from '@/lib/notification-client-cache';

export function useNotificationUnread() {
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
          if (cache) {
            writeNotificationCache({
              ...cache,
              unread: data.unread ?? 0,
              fetchedAt: Date.now(),
            });
          }
        }
      } catch {
        if (!cancelled && !cache) setUnread(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return unread;
}
