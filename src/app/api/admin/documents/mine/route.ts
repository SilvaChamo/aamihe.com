import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/admin-session';
import { documentBelongsToUser } from '@/lib/document-ownership';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';

export async function GET(request: Request) {
  try {
    const session = await requireSessionUser(request);
    if ('error' in session) {
      return NextResponse.json({ success: false, error: session.error }, { status: session.status });
    }

    const db = await getDashboardDb();
    let dirty = false;

    for (const doc of db.documents) {
      if (
        doc.category === 'conferencia' &&
        !doc.user_id &&
        documentBelongsToUser(doc, session.user)
      ) {
        doc.user_id = session.user.id;
        dirty = true;
      }
    }

    if (dirty) {
      await saveDashboardDb(db);
    }

    const documents = db.documents
      .filter(
        (item) => item.category === 'conferencia' && documentBelongsToUser(item, session.user),
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
