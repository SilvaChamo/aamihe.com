import { NextResponse } from 'next/server';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { loadSiteContentFromSupabase, saveSiteContentToSupabase } from '@/lib/supabase-content';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { initialNewsData } from '@/data/news';
import { NEWS_CATEGORIES } from '@/data/news-categories';

export async function GET() {
  try {
    const db = await getDashboardDb();
    const fromSupabase = await loadSiteContentFromSupabase();

    return NextResponse.json({
      success: true,
      supabase: isSupabaseConfigured(),
      news: fromSupabase?.news?.length ? fromSupabase.news : null,
      categories: fromSupabase?.categories?.length ? fromSupabase.categories : null,
      documents: fromSupabase?.documents?.length ? fromSupabase.documents : db.documents,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar conteúdo' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const news = Array.isArray(body.news) ? body.news : initialNewsData.pt;
    const categories = Array.isArray(body.categories) ? body.categories : NEWS_CATEGORIES;
    const db = await getDashboardDb();
    const documents = Array.isArray(body.documents) ? body.documents : db.documents;

    if (Array.isArray(body.documents)) {
      db.documents = documents;
      await saveDashboardDb(db);
    }

    const synced = await saveSiteContentToSupabase({ news, categories, documents });

    return NextResponse.json({ success: true, supabase: synced });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar conteúdo' }, { status: 500 });
  }
}
