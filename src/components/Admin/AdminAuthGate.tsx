'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import AdminLoginPage from '@/components/Admin/AdminLoginPage';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

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
    return (
      <div
        className="admin-auth-gate-loading"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: 14,
        }}
      >
        A carregar…
      </div>
    );
  }

  if (!authorized) {
    return (
      <AdminLoginPage
        redirectTo="/dashboard"
        onSuccess={() => setAuthorized(true)}
      />
    );
  }

  return <>{children}</>;
}
