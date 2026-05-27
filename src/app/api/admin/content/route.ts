import { NextResponse } from 'next/server';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { loadSiteContentFromSupabase, saveSiteContentToSupabase } from '@/lib/supabase-content';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { newsCatalog } from '@/data/news-catalog';
import { NEWS_CATEGORIES } from '@/data/news-categories';
import { mergeNewsCatalog } from '@/lib/site-content-merge';
import { migrateNewsCatalog } from '@/lib/news-i18n';
import type { NewsItem } from '@/data/news';
import type { NewsCategory } from '@/data/news-categories';

function catalogWithTranslations(): NewsItem[] {
  return migrateNewsCatalog(newsCatalog);
}

async function bootstrapIfEmpty(
  news: NewsItem[],
  categories: NewsCategory[],
  documents: Awaited<ReturnType<typeof getDashboardDb>>['documents'],
) {
  if (news.length > 0 || !isSupabaseConfigured()) {
    return { news, categories, bootstrapped: false };
  }

  const catalog = catalogWithTranslations();
  const payload = {
    news: catalog,
    categories: categories.length ? categories : NEWS_CATEGORIES,
    documents,
  };

  await saveSiteContentToSupabase(payload);
  return { news: catalog, categories: payload.categories, bootstrapped: true };
}

export async function GET() {
  try {
    const db = await getDashboardDb();
    const fromSupabase = await loadSiteContentFromSupabase();

    let news = fromSupabase?.news?.length ? fromSupabase.news : [];
    let categories = fromSupabase?.categories?.length ? fromSupabase.categories : NEWS_CATEGORIES;
    const documents = fromSupabase?.documents?.length ? fromSupabase.documents : db.documents;

    const boot = await bootstrapIfEmpty(news, categories, documents);
    news = boot.news;
    categories = boot.categories;

    if (news.length === 0) {
      news = catalogWithTranslations();
    } else {
      news = mergeNewsCatalog(catalogWithTranslations(), news);
    }

    return NextResponse.json({
      success: true,
      supabase: isSupabaseConfigured(),
      bootstrapped: boot.bootstrapped,
      news,
      categories,
      documents,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar conteúdo' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const incomingNews = Array.isArray(body.news) ? (body.news as NewsItem[]) : [];
    const categories = Array.isArray(body.categories) ? body.categories : NEWS_CATEGORIES;
    const db = await getDashboardDb();
    const documents = Array.isArray(body.documents) ? body.documents : db.documents;

    const existing = await loadSiteContentFromSupabase();
    const news =
      incomingNews.length > 0
        ? mergeNewsCatalog(existing?.news ?? [], incomingNews)
        : existing?.news ?? catalogWithTranslations();

    if (Array.isArray(body.documents)) {
      db.documents = documents;
      await saveDashboardDb(db);
    }

    const synced = await saveSiteContentToSupabase({ news, categories, documents });

    return NextResponse.json({ success: true, supabase: synced, count: news.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar conteúdo' }, { status: 500 });
  }
}
