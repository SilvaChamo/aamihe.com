'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';
import { metadataRoleToAppRole, appRoleToSignupMetadataRole } from '@/lib/auth/map-app-role';

export type { UserRole };

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const DEV_PREVIEW_ROLE_KEY = 'aamihe_dev_preview_role';

function applyDevPreviewRole(user: User): User {
  if (process.env.NODE_ENV !== 'development') return user;
  if (typeof window === 'undefined') return user;
  try {
    const r = sessionStorage.getItem(DEV_PREVIEW_ROLE_KEY) as UserRole | '';
    if (r === 'admin' || r === 'editor' || r === 'contribuidor' || r === 'guest') {
      return { ...user, role: r };
    }
  } catch {
    /* ignore */
  }
  return user;
}

function appUserFromSupabaseUser(su: SupabaseUser): User {
  const meta = su.user_metadata || {};
  const name =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    `${meta.first_name || ''} ${meta.last_name || ''}`.trim() ||
    su.email?.split('@')[0] ||
    'Utilizador';
  return {
    id: su.id,
    name,
    email: su.email || '',
    role: metadataRoleToAppRole(meta.role as string | undefined, su.email),
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  setRole: ((role: UserRole) => void) | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const syncFromSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setUser(applyDevPreviewRole(appUserFromSupabaseUser(session.user)));
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    syncFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(applyDevPreviewRole(appUserFromSupabaseUser(session.user)));
      } else {
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) setUser(applyDevPreviewRole(appUserFromSupabaseUser(data.user)));
    return { error: null };
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem(DEV_PREVIEW_ROLE_KEY);
    } catch {
      /* ignore */
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const metaRole = appRoleToSignupMetadataRole(role);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        data: {
          app: 'aamihe',
          username: email.split('@')[0],
          first_name: name,
          last_name: '',
          full_name: name,
          role: metaRole,
        },
      },
    });
    if (error) return { error: error.message };
    if (data.user && data.session) {
      setUser(applyDevPreviewRole(appUserFromSupabaseUser(data.user)));
      return { error: null };
    }
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }
    return { error: null };
  };

  const setRole =
    process.env.NODE_ENV === 'development'
      ? (role: UserRole) => {
          setUser((prev) => (prev ? { ...prev, role } : null));
          try {
            if (role === 'admin') sessionStorage.removeItem(DEV_PREVIEW_ROLE_KEY);
            else sessionStorage.setItem(DEV_PREVIEW_ROLE_KEY, role);
          } catch {
            /* ignore */
          }
        }
      : null;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
