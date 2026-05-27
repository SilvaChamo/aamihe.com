'use client';

import React, { useEffect, useState } from 'react';
import { clearAdminSecret, getAdminSecret } from '@/lib/admin-auth';
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

  return (
    <>
      <div
        style={{
          background: '#561713',
          color: '#fff',
          fontSize: '12px',
          padding: '6px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Sessão admin activa</span>
        <button
          type="button"
          onClick={() => {
            clearAdminSecret();
            setSecret('');
          }}
          style={{
            background: 'transparent',
            border: '1px solid #cca876',
            color: '#fff',
            borderRadius: '3px',
            padding: '2px 8px',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>
      {children}
    </>
  );
}
