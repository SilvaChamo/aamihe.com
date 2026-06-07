'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_SITE_GENERAL_CONFIG,
  mergeSiteGeneralConfig,
  type SiteGeneralConfig,
} from '@/lib/site-general-config';

type SiteGeneralConfigState = {
  general: SiteGeneralConfig;
  loaded: boolean;
};

const SiteGeneralConfigContext = createContext<SiteGeneralConfigState>({
  general: DEFAULT_SITE_GENERAL_CONFIG,
  loaded: false,
});

let cachedGeneral: SiteGeneralConfig | null = null;
let inflight: Promise<SiteGeneralConfig | null> | null = null;

async function fetchSiteGeneralConfigOnce(): Promise<SiteGeneralConfig | null> {
  if (cachedGeneral) return cachedGeneral;
  if (inflight) return inflight;

  inflight = fetch('/api/public/site-config')
    .then((res) => res.json())
    .then((data) => {
      const general = data?.general ? mergeSiteGeneralConfig(data.general) : null;
      if (general) cachedGeneral = general;
      return general;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function SiteGeneralConfigProvider({ children }: { children: ReactNode }) {
  const [general, setGeneral] = useState<SiteGeneralConfig>(
    () => cachedGeneral ?? DEFAULT_SITE_GENERAL_CONFIG,
  );
  const [loaded, setLoaded] = useState(() => Boolean(cachedGeneral));

  useEffect(() => {
    let cancelled = false;

    fetchSiteGeneralConfigOnce()
      .then((next) => {
        if (cancelled || !next) return;
        setGeneral(next);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ general, loaded }), [general, loaded]);

  return (
    <SiteGeneralConfigContext.Provider value={value}>{children}</SiteGeneralConfigContext.Provider>
  );
}

export function useSiteGeneralConfig(): SiteGeneralConfigState {
  return useContext(SiteGeneralConfigContext);
}
