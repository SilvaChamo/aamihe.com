'use client';

import { useEffect } from 'react';

const FB_SDK_ID = 'facebook-jssdk';
const FB_PAGE_URL = 'https://www.facebook.com/GBHEMLEADHubs';

export default function FacebookPageEmbed() {
  useEffect(() => {
    if (document.getElementById(FB_SDK_ID)) {
      window.FB?.XFBML?.parse?.();
      return;
    }

    const script = document.createElement('script');
    script.id = FB_SDK_ID;
    script.src = 'https://connect.facebook.net/pt_PT/sdk.js#xfbml=1&version=v18.0';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, []);

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
