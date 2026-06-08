import { NextResponse } from 'next/server';
import { listDocuments } from '@/lib/aamihe-documents-store';
import { loadSiteNews } from '@/lib/load-site-news';
import { saveSiteContentToSupabase } from '@/lib/supabase-content';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { NEWS_CATEGORIES } from '@/data/news-categories';
import { newsCatalog } from '@/data/news-catalog';
import { resolveNewsItemImages } from '@/lib/resolve-news-images';
import type { NewsItem } from '@/data/news';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const loaded = await loadSiteNews({ bootstrapIfEmpty: true });
    let documents: Awaited<ReturnType<typeof listDocuments>> = [];
    try {
      documents = await listDocuments();
    } catch (docErr) {
      console.warn('Documents list skipped:', docErr);
    }

    return NextResponse.json(
      {
        success: true,
        supabase: isSupabaseConfigured(),
        source: loaded.source,
        bootstrapped: loaded.bootstrapped,
        news: loaded.news,
        categories: loaded.categories,
        documents,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(error);
    const fallbackNews = await resolveNewsItemImages(newsCatalog);
    return NextResponse.json(
      {
        success: true,
        supabase: false,
        source: 'static',
        bootstrapped: false,
        news: fallbackNews,
        categories: NEWS_CATEGORIES,
        documents: [],
        fallback: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const news = Array.isArray(body.news) ? (body.news as NewsItem[]) : [];
    const categories = Array.isArray(body.categories) ? body.categories : NEWS_CATEGORIES;

    const synced = await saveSiteContentToSupabase({ news, categories, documents: [] });

    if (!synced) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Não foi possível guardar no Supabase. Verifique SUPABASE_SERVICE_ROLE_KEY no servidor.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, supabase: true, count: news.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao guardar conteúdo' }, { status: 500 });
  }
}
