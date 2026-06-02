'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  adminFetch,
  getSessionProfile,
  isSessionProfileCacheFresh,
  setSessionProfile,
} from '@/lib/admin-auth';
import { isSubscriberRole, type UserProfile } from '@/lib/user-types';

export type SessionState = {
  user: UserProfile | null;
  isAdminSecret: boolean;
  loading: boolean;
  isSubscriber: boolean;
  isStaff: boolean;
};

const SessionUserContext = createContext<SessionState | null>(null);

/** Uma única verificação de sessão para todo o painel (evita 3–4× /api/admin/users/me). */
export function SessionUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getSessionProfile());
  const [isAdminSecret, setIsAdminSecret] = useState(false);
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !getSessionProfile();
  });

  useEffect(() => {
    if (isSessionProfileCacheFresh()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const hadCachedProfile = Boolean(getSessionProfile());

    (async () => {
      try {
        const res = await adminFetch('/api/admin/users/me', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setIsAdminSecret(Boolean(data.isAdminSecret));
          const nextUser = (data.user as UserProfile | null) ?? null;
          setUser(nextUser);
          setSessionProfile(nextUser);
        } else if (!hadCachedProfile) {
          setUser(null);
          setIsAdminSecret(false);
          setSessionProfile(null);
        }
      } catch {
        if (!cancelled && !hadCachedProfile) {
          setUser(null);
          setIsAdminSecret(false);
          setSessionProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionState>(() => {
    const isSubscriber = !isAdminSecret && !!user && isSubscriberRole(user.role);
    const isStaff = isAdminSecret || (!!user && !isSubscriberRole(user.role));
    return { user, isAdminSecret, loading, isSubscriber, isStaff };
  }, [user, isAdminSecret, loading]);

  return (
    <SessionUserContext.Provider value={value}>{children}</SessionUserContext.Provider>
  );
}

export function useSessionUser(): SessionState {
  const ctx = useContext(SessionUserContext);
  if (!ctx) {
    throw new Error('useSessionUser deve ser usado dentro de SessionUserProvider');
  }
  return ctx;
}
