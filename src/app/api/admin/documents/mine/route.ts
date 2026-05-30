import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import { getDashboardDb } from '@/lib/dashboard-db';

export async function GET(request: Request) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const email = session.user.email.toLowerCase();
    const db = await getDashboardDb();
    const documents = db.documents
      .filter(
        (item) =>
          item.category === 'conferencia' &&
          String(item.email || '')
            .trim()
            .toLowerCase() === email,
      )
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documentos' }, { status: 500 });
  }
}
