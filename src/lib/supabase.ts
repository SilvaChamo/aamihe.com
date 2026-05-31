import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

function createOfflineClient(): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: 'Supabase não configurado' },
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: { message: 'Supabase não configurado' },
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ data: { provider: 'google', url: '' }, error: { message: 'Supabase não configurado' } }),
      resetPasswordForEmail: async () => ({ data: {}, error: { message: 'Supabase não configurado' } }),
      updateUser: async () => ({ data: { user: null }, error: { message: 'Supabase não configurado' } }),
    },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: { detectSessionInUrl: true, flowType: 'pkce' },
      })
    : createOfflineClient();
