import { NextResponse } from 'next/server';
import { loadSiteNews } from '@/lib/load-site-news';
import { newsCatalog } from '@/data/news-catalog';
import { resolveNewsItemImages } from '@/lib/resolve-news-images';
import { enrichNewsList } from '@/data/noticias/merge-catalog-translations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Notícias publicadas no site — mesma fonte que o painel (Supabase site_content). */
export async function GET() {
  try {
    const loaded = await loadSiteNews({ bootstrapIfEmpty: false });

    return NextResponse.json(
      {
        success: true,
        source: loaded.source,
        news: loaded.news,
        categories: loaded.categories,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(error);
    const fallback = enrichNewsList(await resolveNewsItemImages(newsCatalog));
    return NextResponse.json(
      { success: true, source: 'static', news: fallback, fallback: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
