'use client';

import { Suspense } from 'react';
import DashboardContent from '@/components/Admin/DashboardContent';

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500 text-sm">A carregar…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
