import 'server-only';

import type { SiteDocumentCategory, SiteDocumentRecord } from '@/lib/site-documents';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import type { UserProfile } from '@/lib/user-types';

const TABLE = 'aamihe_documents';

type DocumentRow = {
  id: string;
  site_slug: string;
  title_pt: string;
  title_en: string | null;
  title_fr: string | null;
  file_url: string;
  language: string;
  category: string;
  published: boolean;
  sort_order: number;
  author: string | null;
  email: string | null;
  user_id: string | null;
  message: string | null;
  year: string | null;
  file_type: string | null;
  mime_type: string | null;
  source: string | null;
  review_status: string | null;
  review_comment: string | null;
  review_comment_at: string | null;
  reviewed_at: string | null;
  resubmitted_at: string | null;
  created_at: string;
  updated_at: string;
};

function admin() {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase não configurado (SUPABASE_SERVICE_ROLE_KEY).');
  }
  return client;
}

function hasDocumentsAdmin(): boolean {
  return Boolean(getSupabaseAdmin() && isSupabaseConfigured());
}

function rowToRecord(row: DocumentRow): SiteDocumentRecord {
  return {
    id: row.id,
    site_slug: row.site_slug,
    title_pt: row.title_pt,
    title_en: row.title_en,
    title_fr: row.title_fr,
    file_url: row.file_url,
    language: row.language as SiteDocumentRecord['language'],
    category: row.category as SiteDocumentCategory,
    published: row.published,
    sort_order: row.sort_order,
    author: row.author ?? undefined,
    email: row.email ?? undefined,
    user_id: row.user_id ?? undefined,
    message: row.message ?? undefined,
    year: row.year ?? undefined,
    file_type: row.file_type ?? undefined,
    mime_type: row.mime_type ?? undefined,
    source: (row.source as SiteDocumentRecord['source']) ?? undefined,
    review_status: (row.review_status as SiteDocumentRecord['review_status']) ?? undefined,
    review_comment: row.review_comment ?? undefined,
    review_comment_at: row.review_comment_at ?? undefined,
    reviewed_at: row.reviewed_at ?? undefined,
    resubmitted_at: row.resubmitted_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function recordToRow(doc: SiteDocumentRecord): DocumentRow {
  return {
    id: doc.id,
    site_slug: doc.site_slug,
    title_pt: doc.title_pt,
    title_en: doc.title_en,
    title_fr: doc.title_fr,
    file_url: doc.file_url,
    language: doc.language,
    category: doc.category,
    published: doc.published,
    sort_order: doc.sort_order,
    author: doc.author ?? null,
    email: doc.email ?? null,
    user_id: doc.user_id ?? null,
    message: doc.message ?? null,
    year: doc.year ?? null,
    file_type: doc.file_type ?? null,
    mime_type: doc.mime_type ?? null,
    source: doc.source ?? null,
    review_status: doc.review_status ?? null,
    review_comment: doc.review_comment ?? null,
    review_comment_at: doc.review_comment_at ?? null,
    reviewed_at: doc.reviewed_at ?? null,
    resubmitted_at: doc.resubmitted_at ?? null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

export function isDocumentsStoreConfigured(): boolean {
  return isSupabaseConfigured();
}

export async function listDocuments(options?: {
  category?: SiteDocumentCategory;
  published?: boolean;
}): Promise<SiteDocumentRecord[]> {
  if (!hasDocumentsAdmin()) {
    return [];
  }

  try {
    let query = admin().from(TABLE).select('*');

    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.published !== undefined) {
      query = query.eq('published', options.published);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('[aamihe_documents] list:', error.message);
      return [];
    }

    return ((data ?? []) as DocumentRow[]).map(rowToRecord);
  } catch (err) {
    console.error('[aamihe_documents] list failed:', err);
    return [];
  }
}

export async function countDocuments(): Promise<number> {
  if (!hasDocumentsAdmin()) return 0;

  try {
    const { count, error } = await admin()
      .from(TABLE)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error('[aamihe_documents] count:', error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('[aamihe_documents] count failed:', err);
    return 0;
  }
}

export async function listDocumentsForUser(user: UserProfile): Promise<SiteDocumentRecord[]> {
  const email = user.email.trim().toLowerCase();

  const [byUserId, byEmail] = await Promise.all([
    admin()
      .from(TABLE)
      .select('*')
      .eq('category', 'conferencia')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin()
      .from(TABLE)
      .select('*')
      .eq('category', 'conferencia')
      .ilike('email', email)
      .order('created_at', { ascending: false }),
  ]);

  if (byUserId.error) {
    console.error('[aamihe_documents] listForUser user_id:', byUserId.error.message);
    throw new Error('Não foi possível carregar os seus documentos.');
  }
  if (byEmail.error) {
    console.error('[aamihe_documents] listForUser email:', byEmail.error.message);
    throw new Error('Não foi possível carregar os seus documentos.');
  }

  const merged = new Map<string, SiteDocumentRecord>();
  for (const row of [...(byUserId.data ?? []), ...(byEmail.data ?? [])] as DocumentRow[]) {
    merged.set(row.id, rowToRecord(row));
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function getDocumentById(id: string): Promise<SiteDocumentRecord | null> {
  const { data, error } = await admin().from(TABLE).select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('[aamihe_documents] getById:', error.message);
    throw new Error('Não foi possível carregar o documento.');
  }

  return data ? rowToRecord(data as DocumentRow) : null;
}

export async function insertDocuments(documents: SiteDocumentRecord[]): Promise<void> {
  if (documents.length === 0) return;

  const { error } = await admin()
    .from(TABLE)
    .upsert(documents.map(recordToRow), { onConflict: 'id' });

  if (error) {
    console.error('[aamihe_documents] insert:', error.message);
    throw new Error('Não foi possível guardar o documento.');
  }
}

export async function updateDocument(
  id: string,
  patch: Partial<SiteDocumentRecord>,
): Promise<SiteDocumentRecord> {
  const existing = await getDocumentById(id);
  if (!existing) {
    throw new Error('Documento não encontrado.');
  }

  const merged: SiteDocumentRecord = {
    ...existing,
    ...patch,
    id: existing.id,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  };

  const { error } = await admin().from(TABLE).update(recordToRow(merged)).eq('id', id);

  if (error) {
    console.error('[aamihe_documents] update:', error.message);
    throw new Error('Não foi possível actualizar o documento.');
  }

  return merged;
}

export async function deleteDocumentById(id: string): Promise<void> {
  const { error } = await admin().from(TABLE).delete().eq('id', id);

  if (error) {
    console.error('[aamihe_documents] delete:', error.message);
    throw new Error('Não foi possível eliminar o documento.');
  }
}

/** Liga documentos antigos (só email) ao user_id da sessão actual. */
export async function backfillUserIdForDocuments(
  user: UserProfile,
  documents: SiteDocumentRecord[],
): Promise<number> {
  const email = user.email.trim().toLowerCase();
  let updated = 0;

  for (const doc of documents) {
    if (doc.user_id || !doc.email || doc.email.trim().toLowerCase() !== email) continue;
    await updateDocument(doc.id, { user_id: user.id });
    updated++;
  }

  return updated;
}

export async function nextSortOrder(): Promise<number> {
  const { count, error } = await admin()
    .from(TABLE)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[aamihe_documents] count:', error.message);
    return 1;
  }

  return (count ?? 0) + 1;
}
