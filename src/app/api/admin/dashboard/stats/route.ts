import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { listDocuments } from '@/lib/aamihe-documents-store';
import { loadSiteContentFromSupabase } from '@/lib/supabase-content';
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

    const [remoteCounts, content, documents] = await Promise.all([
      isSupabaseConfigured() ? countSupabaseMediaByCategory() : Promise.resolve(null),
      loadSiteContentFromSupabase(),
      listDocuments(),
    ]);

    const mediaCounts: Record<MediaCategory, number> = remoteCounts ?? {
      imagens: 0,
      videos: 0,
      documentos: 0,
    };

    return NextResponse.json({
      success: true,
      stats: {
        news: content?.news?.length ?? 0,
        media: mediaCounts.imagens,
        videos: mediaCounts.videos,
        documents: documents.length,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
