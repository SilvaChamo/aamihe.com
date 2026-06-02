import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-session';
import {
  notifyDocumentApproved,
  notifyDocumentRevisionRequested,
} from '@/lib/document-review';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { syncDocumentsToSupabase } from '@/lib/sync-site-documents';
import { findUserByLogin } from '@/lib/users';

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
    const approvalMessage = String(body.message || '').trim();
    const revisionComment = String(body.comment || '').trim();

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
    if (!current.user_id && current.email) {
      try {
        const profile = await findUserByLogin(current.email);
        if (profile?.id) {
          current.user_id = profile.id;
        }
      } catch (error) {
        console.error('Failed to resolve document user_id before notification:', error);
      }
    }

    if (action === 'approve') {
      const message = approvalMessage;
      current.review_status = 'approved';
      current.published = true;
      current.reviewed_at = now;
      current.review_comment = message || undefined;
      current.review_comment_at = message ? now : undefined;
      current.updated_at = now;

      db.documents[index] = current;
      await saveDashboardDb(db);
      const warnings: string[] = [];
      try {
        await syncDocumentsToSupabase();
      } catch (error) {
        console.error('Documents sync failed after approval:', error);
        warnings.push('Sincronização do site pendente.');
      }
      try {
        await notifyDocumentApproved(current, message);
      } catch (error) {
        console.error('Approval notification failed:', error);
        const detail =
          error instanceof Error ? error.message : 'Falha desconhecida ao notificar o subscritor.';
        warnings.push(`Notificação externa: ${detail}`);
      }

      return NextResponse.json({ success: true, document: current, warnings });
    }

    const comment = revisionComment;
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
    const warnings: string[] = [];
    try {
      await syncDocumentsToSupabase();
    } catch (error) {
      console.error('Documents sync failed after revision request:', error);
      warnings.push('Sincronização do site pendente.');
    }
    try {
      await notifyDocumentRevisionRequested(current, comment);
    } catch (error) {
      console.error('Revision notification failed:', error);
      const detail =
        error instanceof Error ? error.message : 'Falha desconhecida ao notificar o subscritor.';
      warnings.push(`Notificação externa: ${detail}`);
    }

    return NextResponse.json({ success: true, document: current, warnings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao rever documento.' }, { status: 500 });
  }
}
