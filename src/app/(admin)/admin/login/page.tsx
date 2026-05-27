'use client';

import AdminLoginPage from '@/components/Admin/AdminLoginPage';
import { getAdminSecret } from '@/lib/admin-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const next = searchParams.get('next');
  const initialMode = action === 'register' ? 'register' : 'login';
  const redirectTo =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  useEffect(() => {
    if (getAdminSecret()) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  return <AdminLoginPage redirectTo={redirectTo} initialMode={initialMode} />;
}

export default function AdminLoginRoutePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>A carregar...</div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
