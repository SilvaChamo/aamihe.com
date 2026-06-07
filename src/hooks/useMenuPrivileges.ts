'use client';

import { useEffect, useState } from 'react';
import {
  defaultMenuPrivileges,
  resolveMenuPrivileges,
  type MenuPrivilegesConfig,
} from '@/lib/menu-privileges';
import { fetchSettingsCached, peekCachedSettings, subscribeSettingsCache } from '@/lib/settings-cache';

export function useMenuPrivileges() {
  const [privileges, setPrivileges] = useState<MenuPrivilegesConfig>(defaultMenuPrivileges);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const apply = (settings: unknown) => {
      if (!cancelled) setPrivileges(resolveMenuPrivileges(settings as never));
    };

    const cached = peekCachedSettings();
    if (cached) {
      apply(cached);
      setLoading(false);
    }

    const load = () => {
      fetchSettingsCached()
        .then(apply)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const unsubscribe = subscribeSettingsCache(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { privileges, loading };
}
