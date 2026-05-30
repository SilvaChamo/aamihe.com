import type { SiteDocumentRecord } from '@/lib/site-documents';
import type { UserProfile } from '@/lib/user-types';

export function documentBelongsToUser(doc: SiteDocumentRecord, user: UserProfile) {
  if (doc.user_id && doc.user_id === user.id) return true;
  const docEmail = String(doc.email || '')
    .trim()
    .toLowerCase();
  const userEmail = user.email.trim().toLowerCase();
  return docEmail.length > 0 && docEmail === userEmail;
}
