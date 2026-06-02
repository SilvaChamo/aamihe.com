'use client';

import { Suspense } from 'react';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import DashboardContent from '@/components/Admin/DashboardContent';
import SubscriberWelcomeContent from '@/components/Admin/SubscriberWelcomeContent';
import { useSessionUser } from '@/hooks/useSessionUser';
import { useAdminBase } from '@/lib/admin-base';

function DashboardPageInner() {
  const base = useAdminBase();
  const { loading, isSubscriber } = useSessionUser();

  if (loading) {
    return (
      <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
        <AdminPanelLoading variant="dashboard" />
      </div>
    );
  }

  if (base === '/dashboard' && isSubscriber) {
    return <SubscriberWelcomeContent />;
  }

  return <DashboardContent />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
          <AdminPanelLoading variant="dashboard" />
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}
