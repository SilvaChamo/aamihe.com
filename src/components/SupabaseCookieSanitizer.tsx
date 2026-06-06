'use client';

import { useEffect } from 'react';
import { clearStaleSupabaseAuthCookiesInBrowser } from '@/lib/supabase-auth-cookies';

/** Limpa cookies Supabase legados no browser (complementa o proxy). */
export default function SupabaseCookieSanitizer() {
  useEffect(() => {
    clearStaleSupabaseAuthCookiesInBrowser();
  }, []);
  return null;
}
