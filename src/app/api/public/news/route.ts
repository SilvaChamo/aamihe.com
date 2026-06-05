import { NextResponse } from 'next/server';
import { newsCatalog } from '@/data/news-catalog';
import { resolveNewsItemImages } from '@/lib/resolve-news-images';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Notícias com imagens resolvidas (Supabase / ficheiros locais). Fallback quando /api/admin/content falha. */
export async function GET() {
  try {
    const news = await resolveNewsItemImages(newsCatalog);
    return NextResponse.json(
      { success: true, news },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: true, news: newsCatalog, fallback: true });
  }
}
