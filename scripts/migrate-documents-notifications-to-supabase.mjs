#!/usr/bin/env node
/**
 * Migra documentos e notificações de Blob/local JSON → Supabase (Hetzner).
 * Requer: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY no .env.local
 * Opcional: BLOB_READ_WRITE_TOKEN (lê dashboard/notifications do Blob se existir)
 *
 * Antes: executar scripts/supabase-hetzner/aamihe-documents-notifications.sql
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(path.join(root, name), 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* skip */
    }
  }
}

async function loadFromBlob(blobPath) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { get } = await import('@vercel/blob');
    const access = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
    const result = await get(blobPath, { access });
    if (!result?.stream) return null;
    return JSON.parse(await new Response(result.stream).text());
  } catch {
    return null;
  }
}

function docToRow(doc) {
  return {
    id: doc.id,
    site_slug: doc.site_slug ?? 'aamihe',
    title_pt: doc.title_pt,
    title_en: doc.title_en ?? null,
    title_fr: doc.title_fr ?? null,
    file_url: doc.file_url,
    language: doc.language ?? 'pt',
    category: doc.category ?? 'conferencia',
    published: Boolean(doc.published),
    sort_order: doc.sort_order ?? 0,
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
    created_at: doc.created_at ?? new Date().toISOString(),
    updated_at: doc.updated_at ?? new Date().toISOString(),
  };
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let documents = [];
let notifications = [];

const blobDash = await loadFromBlob('aamihe/dashboard.json');
if (blobDash?.documents?.length) {
  documents = blobDash.documents;
  console.log(`Blob dashboard: ${documents.length} documentos`);
}

if (!documents.length) {
  try {
    const local = JSON.parse(readFileSync(path.join(root, 'aamihe_dashboard.json'), 'utf8'));
    documents = local.documents ?? [];
    console.log(`Local dashboard: ${documents.length} documentos`);
  } catch {
    /* empty */
  }
}

const blobNotifs = await loadFromBlob('aamihe/notifications.json');
if (Array.isArray(blobNotifs) && blobNotifs.length) {
  notifications = blobNotifs;
} else {
  try {
    notifications = JSON.parse(readFileSync(path.join(root, 'aamihe_notifications.json'), 'utf8'));
  } catch {
    notifications = blobDash?.notifications ?? [];
  }
}

if (!documents.length && !notifications.length) {
  console.log('Nada para migrar.');
  process.exit(0);
}

if (documents.length) {
  const { error } = await admin.from('aamihe_documents').upsert(documents.map(docToRow), { onConflict: 'id' });
  if (error) {
    console.error('Erro documentos:', error.message);
    console.error('Executou aamihe-documents-notifications.sql no Postgres?');
    process.exit(1);
  }
  console.log(`Migrados ${documents.length} documentos → aamihe_documents`);

  const { error: clearErr } = await admin
    .from('site_content')
    .update({ documents: [], updated_at: new Date().toISOString() })
    .eq('site_slug', 'aamihe');
  if (clearErr) console.warn('Aviso ao limpar site_content.documents:', clearErr.message);
}

if (notifications.length) {
  const rows = notifications.map((n) => ({
    id: n.id,
    user_id: n.user_id,
    document_id: n.document_id || null,
    type: n.type,
    title: n.title,
    message: n.message,
    read: Boolean(n.read),
    created_at: n.created_at ?? new Date().toISOString(),
  }));
  const { error } = await admin.from('aamihe_subscriber_notifications').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Erro notificações:', error.message);
    process.exit(1);
  }
  console.log(`Migradas ${notifications.length} notificações → aamihe_subscriber_notifications`);
}

console.log('Concluído. Pode desactivar BLOB_READ_WRITE_TOKEN para documentos (multimédia no dashboard.json ainda usa Blob se configurado).');
