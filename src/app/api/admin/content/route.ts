import { NextResponse } from 'next/server';
import { listDocuments } from '@/lib/aamihe-documents-store';
import { loadSiteContentFromSupabase, saveSiteContentToSupabase } from '@/lib/supabase-content';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { newsCatalog } from '@/data/news-catalog';
import { NEWS_CATEGORIES } from '@/data/news-categories';
import type { NewsItem } from '@/data/news';
import type { NewsCategory } from '@/data/news-categories';

async function bootstrapIfEmpty(news: NewsItem[], categories: NewsCategory[]) {
  if (news.length > 0 || !isSupabaseConfigured()) {
    return { news, categories, bootstrapped: false };
  }

  const payload = {
    news: newsCatalog,
    categories: categories.length ? categories : NEWS_CATEGORIES,
    documents: [] as never[],
  };

  await saveSiteContentToSupabase(payload);
  return { news: payload.news, categories: payload.categories, bootstrapped: true };
}

export async function GET() {
  try {
    const fromSupabase = await loadSiteContentFromSupabase();
    let documents: Awaited<ReturnType<typeof listDocuments>> = [];
    try {
      documents = await listDocuments();
    } catch (docErr) {
      console.warn('Documents list skipped:', docErr);
    }

    let news = fromSupabase?.news?.length ? fromSupabase.news : [];
    let categories = fromSupabase?.categories?.length ? fromSupabase.categories : NEWS_CATEGORIES;

    const boot = await bootstrapIfEmpty(news, categories);
    news = boot.news;
    categories = boot.categories;

    if (news.length === 0) {
      news = newsCatalog;
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
    return NextResponse.json({
      success: true,
      supabase: false,
      bootstrapped: false,
      news: newsCatalog,
      categories: NEWS_CATEGORIES,
      documents: [],
      fallback: true,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const news = Array.isArray(body.news) ? (body.news as NewsItem[]) : [];
    const categories = Array.isArray(body.categories) ? body.categories : NEWS_CATEGORIES;
    const documents = await listDocuments();

    const synced = await saveSiteContentToSupabase({ news, categories, documents: [] });

    return NextResponse.json({ success: true, supabase: synced, count: news.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar conteúdo' }, { status: 500 });
  }
}
