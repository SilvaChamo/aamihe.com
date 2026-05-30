import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-session';
import {
  notifyDocumentApproved,
  notifyDocumentRevisionRequested,
} from '@/lib/document-review';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { syncDocumentsToSupabase } from '@/lib/sync-site-documents';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdminRole(request);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action || '');

    if (action !== 'approve' && action !== 'request_revision') {
      return NextResponse.json({ success: false, error: 'Acção inválida.' }, { status: 400 });
    }

    const db = await getDashboardDb();
    const index = db.documents.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    const current = db.documents[index];
    const now = new Date().toISOString();

    if (action === 'approve') {
      current.review_status = 'approved';
      current.published = true;
      current.reviewed_at = now;
      current.review_comment = undefined;
      current.review_comment_at = undefined;
      current.updated_at = now;

      db.documents[index] = current;
      await saveDashboardDb(db);
      await syncDocumentsToSupabase();
      await notifyDocumentApproved(current);

      return NextResponse.json({ success: true, document: current });
    }

    const comment = String(body.comment || '').trim();
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Escreva o comentário para o subscritor.' },
        { status: 400 },
      );
    }

    current.review_status = 'revision_requested';
    current.published = false;
    current.review_comment = comment;
    current.review_comment_at = now;
    current.reviewed_at = now;
    current.updated_at = now;

    db.documents[index] = current;
    await saveDashboardDb(db);
    await syncDocumentsToSupabase();
    await notifyDocumentRevisionRequested(current, comment);

    return NextResponse.json({ success: true, document: current });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao rever documento.' }, { status: 500 });
  }
}
