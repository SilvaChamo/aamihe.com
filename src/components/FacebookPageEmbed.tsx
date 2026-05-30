'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const FB_SDK_ID = 'facebook-jssdk';
const FB_PAGE_URL = 'https://www.facebook.com/GBHEMLEADHubs';

export default function FacebookPageEmbed() {
  const { locale } = useLanguage();
  const fbLocale = locale === 'pt' ? 'pt_PT' : locale === 'fr' ? 'fr_FR' : 'en_US';

  useEffect(() => {
    const existing = document.getElementById(FB_SDK_ID);
    if (existing) {
      existing.remove();
    }

    const script = document.createElement('script');
    script.id = FB_SDK_ID;
    script.src = `https://connect.facebook.net/${fbLocale}/sdk.js#xfbml=1&version=v18.0`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, [fbLocale]);

  return (
    <div
      className="fb-page"
      data-href={FB_PAGE_URL}
      data-tabs="timeline"
      data-width="500"
      data-height="550"
      data-small-header="false"
      data-adapt-container-width="true"
      data-hide-cover="false"
      data-show-facepile="true"
    />
  );
}

declare global {
  interface Window {
    FB?: { XFBML?: { parse?: () => void } };
  }
}
