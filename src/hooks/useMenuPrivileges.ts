'use client';

import { useEffect, useState } from 'react';
import {
  defaultMenuPrivileges,
  resolveMenuPrivileges,
  type MenuPrivilegesConfig,
} from '@/lib/menu-privileges';
import { fetchSettingsCached, peekCachedSettings, subscribeSettingsCache } from '@/lib/settings-cache';

export function useMenuPrivileges() {
  const [privileges, setPrivileges] = useState<MenuPrivilegesConfig>(() => {
    const cached = peekCachedSettings();
    return cached ? resolveMenuPrivileges(cached as never) : defaultMenuPrivileges();
  });
  const [loading, setLoading] = useState(() => !peekCachedSettings());

  useEffect(() => {
    let cancelled = false;

    const apply = (settings: unknown) => {
      if (!cancelled) setPrivileges(resolveMenuPrivileges(settings as never));
    };

    fetchSettingsCached()
      .then(apply)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeSettingsCache(() => {
      const cached = peekCachedSettings();
      if (cached) apply(cached);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { privileges, loading };
}
