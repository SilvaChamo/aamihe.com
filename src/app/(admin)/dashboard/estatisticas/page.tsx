import { Suspense } from 'react';
import SiteStatsPage from '@/components/Admin/SiteStatsPage';

export default function AdminEstatisticasPage() {
  return (
    <Suspense fallback={null}>
      <SiteStatsPage />
    </Suspense>
  );
}
