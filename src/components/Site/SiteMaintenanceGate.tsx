'use client';

import { usePathname } from 'next/navigation';
import { useSiteGeneralConfig } from '@/hooks/useSiteGeneralConfig';
import MaintenanceScreen from '@/components/Site/MaintenanceScreen';

function isAdminOrApiPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/')
  );
}

export default function SiteMaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { general, loaded } = useSiteGeneralConfig();

  if (isAdminOrApiPath(pathname)) {
    return <>{children}</>;
  }

  if (loaded && general.maintenanceMode) {
    return <MaintenanceScreen config={general} />;
  }

  return <>{children}</>;
}
