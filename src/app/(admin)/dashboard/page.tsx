'use client';

import { Suspense } from 'react';
import DashboardContent from '@/components/Admin/DashboardContent';
import SubscriberWelcomeContent from '@/components/Admin/SubscriberWelcomeContent';
import { useSessionUser } from '@/hooks/useSessionUser';
import { useAdminBase } from '@/lib/admin-base';

function DashboardPageInner() {
  const base = useAdminBase();
  const { loading, isSubscriber } = useSessionUser();

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">A carregar…</div>;
  }

  if (base === '/dashboard' && isSubscriber) {
    return <SubscriberWelcomeContent />;
  }

  return <DashboardContent />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500 text-sm">A carregar…</div>}>
      <DashboardPageInner />
    </Suspense>
  );
}
