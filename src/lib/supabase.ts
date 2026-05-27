import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

function createOfflineClient(): SupabaseClient {
  const noop = { data: null, error: null };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
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
    },
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createOfflineClient();
