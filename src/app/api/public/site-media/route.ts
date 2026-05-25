import { NextResponse } from 'next/server';
import { getDashboardDb } from '@/lib/dashboard-db';
import { buildMediaCatalog } from '@/lib/media-registry';
import type { MediaCategory } from '@/lib/site-media';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as MediaCategory | null;
    const db = await getDashboardDb();
    let items: Awaited<ReturnType<typeof buildMediaCatalog>> = [];
    try {
      items = await buildMediaCatalog(db);
    } catch (catalogError) {
      console.error('buildMediaCatalog:', catalogError);
      items = db.media.filter((item) => item.published);
    }
    items = items.filter((item) => item.published);
    if (category) {
      items = items.filter((item) => item.category === category);
    }
    return NextResponse.json(
      { success: true, media: items },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar galeria' }, { status: 500 });
  }
}
