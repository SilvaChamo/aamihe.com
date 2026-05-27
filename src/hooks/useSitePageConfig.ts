'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_PAGE_CONFIG,
  mergeSitePageConfig,
  type SitePageConfig,
} from '@/lib/site-page-config';

export function useSitePageConfig() {
  const [pages, setPages] = useState<SitePageConfig>(DEFAULT_SITE_PAGE_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/public/site-config')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.pages) {
          setPages(mergeSitePageConfig(data.pages));
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

  return { pages, loaded };
}
