import 'server-only';

import {
  sendDocumentApprovedEmail,
  sendDocumentRevisionEmail,
} from '@/lib/document-review';
import type { SiteDocumentRecord } from '@/lib/site-documents';

/** E-mail ao subscritor após resposta HTTP (não bloquear o admin). */
export function scheduleDocumentReviewFollowUp(
  doc: SiteDocumentRecord,
  action: 'approve' | 'request_revision',
  payload: { message?: string; comment?: string },
): void {
  void (async () => {
    try {
      if (action === 'approve') {
        await sendDocumentApprovedEmail(doc, payload.message);
      } else if (payload.comment) {
        await sendDocumentRevisionEmail(doc, payload.comment);
      }
    } catch (error) {
      console.error('Email notification failed after review (background):', error);
    }
  })();
}
