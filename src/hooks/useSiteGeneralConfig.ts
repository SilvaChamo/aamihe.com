'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_GENERAL_CONFIG,
  mergeSiteGeneralConfig,
  type SiteGeneralConfig,
} from '@/lib/site-general-config';

export function useSiteGeneralConfig() {
  const [general, setGeneral] = useState<SiteGeneralConfig>(DEFAULT_SITE_GENERAL_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/public/site-config')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.general) {
          setGeneral(mergeSiteGeneralConfig(data.general));
        }
      })
      .catch(() => {
        /* fallback local */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { general, loaded };
}
