import { getDashboardDb } from '@/lib/dashboard-db';
import { loadSiteContentFromSupabase, saveSiteContentToSupabase } from '@/lib/supabase-content';

export async function syncDocumentsToSupabase(): Promise<void> {
  const db = await getDashboardDb();
  const existing = await loadSiteContentFromSupabase();

  await saveSiteContentToSupabase({
    news: existing?.news ?? [],
    categories: existing?.categories ?? [],
    documents: db.documents,
  });
}
