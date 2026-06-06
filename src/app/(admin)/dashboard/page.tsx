'use client';

import { Suspense, useEffect } from 'react';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import DashboardContent from '@/components/Admin/DashboardContent';
import SubscriberWelcomeContent from '@/components/Admin/SubscriberWelcomeContent';
import { useSessionUser } from '@/hooks/useSessionUser';

function DashboardPageInner() {
  const { loading, isSubscriber } = useSessionUser();

  if (loading) {
    return (
      <div className="admin-main-content" aria-busy="true" aria-label="A carregar">
        <AdminPanelLoading variant="dashboard" />
      </div>
    );
  }

  if (isSubscriber) {
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
