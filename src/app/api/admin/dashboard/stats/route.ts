import { NextResponse } from 'next/server';
import { requireStaffSession } from '@/lib/admin-session';
import { countDocuments } from '@/lib/aamihe-documents-store';
import { countNewsFromSupabase } from '@/lib/supabase-content';
import { countSupabaseMediaByCategory } from '@/lib/supabase-media';
import { isSupabaseConfigured, getSupabaseAdmin } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/user-types';
import type { MediaCategory } from '@/lib/site-media';

export const dynamic = 'force-dynamic';

async function countUsersForSession(viewer: UserProfile): Promise<number> {
  if (viewer.role === 'Actor') return 0;
  if (viewer.role === 'Subscritor') return 1;

  const admin = getSupabaseAdmin();
  if (!admin) return 0;

  const isAdmin = viewer.role === 'Administrador' || viewer.isAdmin;
  if (viewer.role === 'Editor' && !isAdmin) {
    const { count: contribCount, error: contribError } = await admin
      .from('aamihe_user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'Contribuidor');
    if (contribError) throw new Error(contribError.message);
    return (contribCount ?? 0) + 1;
  }

  const { count, error } = await admin
    .from('aamihe_user_profiles')
    .select('id', { count: 'exact', head: true })
    .neq('role', 'Subscritor');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function GET(request: Request) {
  try {
    const auth = await requireStaffSession(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [remoteCounts, newsCount, documentCount, usersCount] = await Promise.all([
      isSupabaseConfigured() ? countSupabaseMediaByCategory() : Promise.resolve(null),
      countNewsFromSupabase(),
      countDocuments(),
      countUsersForSession(auth.session.user),
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
        users: usersCount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar estatísticas' }, { status: 500 });
  }
}
