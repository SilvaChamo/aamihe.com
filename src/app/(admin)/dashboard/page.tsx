'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import DashboardContent from '@/components/Admin/DashboardContent';
import SubscriberWelcomeContent from '@/components/Admin/SubscriberWelcomeContent';
import { useSessionUser } from '@/hooks/useSessionUser';

function DashboardPageInner() {
  const router = useRouter();
  const { loading, isSubscriber, isStaff } = useSessionUser();

  useEffect(() => {
    if (!loading && isStaff && !isSubscriber) {
      router.replace('/admin/dashboard');
    }
  }, [loading, isStaff, isSubscriber, router]);

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

  if (isStaff) {
    return (
      <div className="admin-main-content" aria-busy="true" aria-label="A redirecionar">
        <AdminPanelLoading variant="dashboard" />
      </div>
    );
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
