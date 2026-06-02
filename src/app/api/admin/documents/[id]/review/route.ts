import { NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-session';
import {
  createDocumentApprovedNotification,
  createDocumentRevisionNotification,
} from '@/lib/subscriber-notifications';
import { scheduleDocumentReviewFollowUp } from '@/lib/document-review-follow-up';
import { getDocumentById, updateDocument } from '@/lib/aamihe-documents-store';

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

    const existing = await getDocumentById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const message = approvalMessage;
      const current = await updateDocument(id, {
        review_status: 'approved',
        published: true,
        reviewed_at: now,
        review_comment: message || undefined,
        review_comment_at: message ? now : undefined,
        updated_at: now,
      });

      try {
        await createDocumentApprovedNotification(current, message);
      } catch (error) {
        console.error('Panel notification failed after approval:', error);
      }

      scheduleDocumentReviewFollowUp(current, 'approve', { message });

      return NextResponse.json({ success: true, document: current });
    }

    const comment = revisionComment;
    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Escreva o comentário para o subscritor.' },
        { status: 400 },
      );
    }

    const current = await updateDocument(id, {
      review_status: 'revision_requested',
      published: false,
      review_comment: comment,
      review_comment_at: now,
      reviewed_at: now,
      updated_at: now,
    });

    try {
      await createDocumentRevisionNotification(current, comment);
    } catch (error) {
      console.error('Panel notification failed after revision request:', error);
    }

    scheduleDocumentReviewFollowUp(current, 'request_revision', { comment });

    return NextResponse.json({ success: true, document: current });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Erro ao rever documento.' }, { status: 500 });
  }
}
