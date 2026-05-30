'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-auth';
import { isSubscriberRole, type UserProfile } from '@/lib/user-types';

type SessionState = {
  user: UserProfile | null;
  isAdminSecret: boolean;
  loading: boolean;
  isSubscriber: boolean;
  isStaff: boolean;
};

export function useSessionUser(): SessionState {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminSecret, setIsAdminSecret] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await adminFetch('/api/admin/users/me', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setIsAdminSecret(Boolean(data.isAdminSecret));
          setUser(data.user ?? null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setIsAdminSecret(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isSubscriber = !isAdminSecret && !!user && isSubscriberRole(user.role);
  const isStaff = isAdminSecret || (!!user && !isSubscriberRole(user.role));

  return { user, isAdminSecret, loading, isSubscriber, isStaff };
}
