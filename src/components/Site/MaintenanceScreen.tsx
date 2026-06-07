'use client';

import Image from 'next/image';
import {
  DEFAULT_MAINTENANCE_IMAGE_URL,
  DEFAULT_SITE_GENERAL_CONFIG,
  type SiteGeneralConfig,
} from '@/lib/site-general-config';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import './MaintenanceScreen.css';

type MaintenanceScreenProps = {
  config?: Pick<SiteGeneralConfig, 'siteName' | 'maintenanceImageUrl'>;
};

export default function MaintenanceScreen({ config }: MaintenanceScreenProps) {
  const siteName = config?.siteName || DEFAULT_SITE_GENERAL_CONFIG.siteName;
  const imageSrc =
    resolveAvatarUrl(config?.maintenanceImageUrl) ||
    DEFAULT_MAINTENANCE_IMAGE_URL;

  return (
    <div className="maintenance-screen">
      <div className="maintenance-screen-inner">
        <div className="maintenance-screen-image-wrap">
          <Image
            src={imageSrc}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 480px"
            className="maintenance-screen-image"
          />
        </div>
        <h1 className="maintenance-screen-title">{siteName}</h1>
        <p className="maintenance-screen-message">
          O site está temporariamente indisponível para manutenção. Voltaremos em breve.
        </p>
      </div>
    </div>
  );
}
