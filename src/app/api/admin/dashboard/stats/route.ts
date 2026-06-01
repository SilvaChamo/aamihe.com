import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { getDashboardDb } from '@/lib/dashboard-db';
import { loadSiteContentFromSupabase } from '@/lib/supabase-content';
import { countSupabaseMediaByCategory } from '@/lib/supabase-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import type { MediaCategory } from '@/lib/site-media';

export const dynamic = 'force-dynamic';

function countLocalMedia(db: Awaited<ReturnType<typeof getDashboardDb>>): Record<MediaCategory, number> {
  const counts = { imagens: 0, videos: 0, documentos: 0 };
  for (const item of db.media) {
    if (!item.published) continue;
    counts[item.category] += 1;
  }
  return counts;
}

export async function GET(request: Request) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = await getDashboardDb();
    const [remoteCounts, content] = await Promise.all([
      isSupabaseConfigured() ? countSupabaseMediaByCategory() : Promise.resolve(null),
      loadSiteContentFromSupabase(),
    ]);

    const localCounts = countLocalMedia(db);
    const mediaCounts = remoteCounts ?? localCounts;

    if (remoteCounts) {
      for (const key of Object.keys(localCounts) as MediaCategory[]) {
        mediaCounts[key] = Math.max(mediaCounts[key], localCounts[key]);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        news: content?.news?.length ?? 0,
        media: mediaCounts.imagens,
        videos: mediaCounts.videos,
        documents: db.documents.length,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
