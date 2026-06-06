'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import AdminLoginPage from '@/components/Admin/AdminLoginPage';
import AdminLoginSkeleton from '@/components/Admin/AdminLoginSkeleton';
import { SessionUserProvider } from '@/hooks/useSessionUser';
import { getSessionProfile } from '@/lib/admin-auth';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    return getSessionProfile() ? true : null;
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setAuthorized(Boolean(session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setAuthorized(Boolean(session));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (authorized === null) {
    return <AdminLoginSkeleton />;
  }

  if (!authorized) {
    return (
      <AdminLoginPage
        redirectTo="/dashboard"
        onSuccess={() => setAuthorized(true)}
      />
    );
  }

  return <SessionUserProvider>{children}</SessionUserProvider>;
}
