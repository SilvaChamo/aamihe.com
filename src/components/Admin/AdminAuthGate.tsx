'use client';

import React, { useEffect, useState } from 'react';
import { getAdminSecret } from '@/lib/admin-auth';
import AdminLoginPage from '@/components/Admin/AdminLoginPage';

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [secret, setSecret] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setSecret(getAdminSecret());
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="admin-login-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p>A verificar acesso...</p>
      </div>
    );
  }

  if (!secret) {
    return (
      <AdminLoginPage
        redirectTo="/dashboard"
        onSuccess={() => setSecret(getAdminSecret())}
      />
    );
  }

  return <>{children}</>;
}
