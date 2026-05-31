'use client';

import AdminLoginPage from '@/components/Admin/AdminLoginPage';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const next = searchParams.get('next');
  const initialMode =
    action === 'new-password' ? 'new-password' : action === 'register' ? 'register' : 'login';
  const redirectTo =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || initialMode === 'new-password') return;
      const me = await fetch('/api/admin/users/me', { credentials: 'same-origin' });
      if (me.ok) {
        router.replace(redirectTo);
      } else {
        await supabase.auth.signOut();
      }
    });
  }, [router, redirectTo, initialMode]);

  return <AdminLoginPage redirectTo={redirectTo} initialMode={initialMode} />;
}

export default function AdminLoginRoutePage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
