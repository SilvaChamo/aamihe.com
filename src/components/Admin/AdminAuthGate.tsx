'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch, clearAdminSecret, getAdminSecret } from '@/lib/admin-auth';
import AdminLoginPage from '@/components/Admin/AdminLoginPage';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const secret = getAdminSecret();
      if (!secret) {
        if (!cancelled) {
          setAuthorized(false);
          setChecking(false);
        }
        return;
      }

      try {
        const res = await adminFetch('/api/admin/users/me', { cache: 'no-store' });
        if (!res.ok) {
          clearAdminSecret();
          if (!cancelled) setAuthorized(false);
          return;
        }
        if (!cancelled) setAuthorized(true);
      } catch {
        clearAdminSecret();
        if (!cancelled) setAuthorized(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="admin-login-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p>A verificar acesso...</p>
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
