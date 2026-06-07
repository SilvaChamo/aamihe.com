'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteGeneralConfig } from '@/hooks/useSiteGeneralConfig';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login')
  );
}

export default function SiteHeadSync() {
  const pathname = usePathname();
  const { general, loaded } = useSiteGeneralConfig();

  useEffect(() => {
    if (!loaded || isAdminPath(pathname)) return;

    if (general.siteName) {
      document.title = general.siteName;
    }

    const faviconUrl = resolveAvatarUrl(general.faviconUrl);
    if (!faviconUrl) return;

    const links = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
    if (links.length) {
      links.forEach((link) => {
        link.href = faviconUrl;
      });
      return;
    }

    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    document.head.appendChild(link);
  }, [general.faviconUrl, general.siteName, loaded, pathname]);

  return null;
}
