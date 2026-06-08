import { Suspense } from 'react';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import SiteStatsPage from '@/components/Admin/SiteStatsPage';

export default function AdminEstatisticasPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
          <AdminPanelLoading />
        </div>
      }
    >
      <SiteStatsPage />
    </Suspense>
  );
}
