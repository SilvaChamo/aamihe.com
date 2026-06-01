'use client';

import AdminLoginPage from '@/components/Admin/AdminLoginPage';
import AdminLoginSkeleton from '@/components/Admin/AdminLoginSkeleton';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const action = searchParams.get('action');
  const next = searchParams.get('next');
  const initialMode =
    action === 'new-password' ? 'new-password' : action === 'register' ? 'register' : 'login';
  const redirectTo =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin/dashboard';

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (!session || initialMode === 'new-password') return;
        const me = await fetch('/api/admin/users/me', { credentials: 'same-origin' });
        if (cancelled) return;
        if (me.ok) {
          const data = await me.json();
          const role = String(data?.user?.role || '');
          const target =
            role === 'Subscritor'
              ? '/dashboard'
              : redirectTo.startsWith('/admin')
                ? redirectTo
                : '/admin/dashboard';
          router.replace(target);
        } else {
          await supabase.auth.signOut();
        }
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo, initialMode]);

  if (checkingSession) {
    return <AdminLoginSkeleton />;
  }

  return <AdminLoginPage redirectTo={redirectTo} initialMode={initialMode} />;
}

export default function AdminLoginRoute() {
  return (
    <Suspense fallback={<AdminLoginSkeleton />}>
      <AdminLoginContent />
    </Suspense>
  );
}
