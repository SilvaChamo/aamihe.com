import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { countDocuments } from '@/lib/aamihe-documents-store';
import { countNewsFromSupabase } from '@/lib/supabase-content';
import { countSupabaseMediaByCategory } from '@/lib/supabase-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import type { MediaCategory } from '@/lib/site-media';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [remoteCounts, newsCount, documentCount] = await Promise.all([
      isSupabaseConfigured() ? countSupabaseMediaByCategory() : Promise.resolve(null),
      countNewsFromSupabase(),
      countDocuments(),
    ]);

    const mediaCounts: Record<MediaCategory, number> = remoteCounts ?? {
      imagens: 0,
      videos: 0,
      documentos: 0,
    };

    return NextResponse.json({
      success: true,
      stats: {
        news: newsCount,
        media: mediaCounts.imagens,
        videos: mediaCounts.videos,
        documents: documentCount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
