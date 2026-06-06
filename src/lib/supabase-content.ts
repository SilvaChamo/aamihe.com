import type { NewsItem } from '@/data/news';
import type { NewsCategory } from '@/data/news-categories';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export type SiteContentPayload = {
  news: NewsItem[];
  categories: NewsCategory[];
  documents: SiteDocumentRecord[];
};

const SITE_SLUG = 'aamihe';

export async function loadSiteContentFromSupabase(): Promise<SiteContentPayload | null> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) return null;

  const { data, error } = await admin
    .from('site_content')
    .select('news, categories, documents')
    .eq('site_slug', SITE_SLUG)
    .maybeSingle();

  if (error) {
    console.error('Supabase load site_content:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    news: (data.news as NewsItem[]) ?? [],
    categories: (data.categories as NewsCategory[]) ?? [],
    documents: (data.documents as SiteDocumentRecord[]) ?? [],
  };
}

/** Contagem leve para estatísticas do painel (sem carregar arrays completos). */
export async function countNewsFromSupabase(): Promise<number> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) return 0;

  const { data, error } = await admin
    .from('site_content')
    .select('news')
    .eq('site_slug', SITE_SLUG)
    .maybeSingle();

  if (error || !data?.news) return 0;
  return Array.isArray(data.news) ? data.news.length : 0;
}

export async function saveSiteContentToSupabase(payload: SiteContentPayload): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) return false;

  const { error } = await admin.from('site_content').upsert(
    {
      site_slug: SITE_SLUG,
      news: payload.news,
      categories: payload.categories,
      documents: payload.documents,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_slug' }
  );

  if (error) {
    console.error('Supabase save site_content:', error.message);
    return false;
  }

  return true;
}
