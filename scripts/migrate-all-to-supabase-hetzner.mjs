#!/usr/bin/env node
/**
 * Migração completa Blob/dashboard.json → Supabase Hetzner.
 *
 * Pré-requisitos (SQL no Postgres):
 *   scripts/supabase-hetzner/aamihe-documents-notifications.sql
 *   scripts/supabase-hetzner/aamihe-email-quota.sql
 *
 * Uso: npm run migrate-all-to-supabase
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

async function loadLegacyDashboard() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const blobMod = await import('@vercel/blob').catch(() => null);
      if (blobMod?.get) {
        const access = process.env.BLOB_ACCESS === 'public' ? 'public' : 'private';
        const result = await blobMod.get('aamihe/dashboard.json', { access });
        if (result?.stream) {
          const parsed = JSON.parse(await new Response(result.stream).text());
          console.log('Origem: Vercel Blob (dashboard.json)');
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Blob indisponível:', e.message);
    }
  }

  try {
    const parsed = JSON.parse(readFileSync(path.join(root, 'aamihe_dashboard.json'), 'utf8'));
    console.log('Origem: ficheiro local aamihe_dashboard.json');
    return parsed;
  } catch {
    return { media: [], emailSendLog: { days: {} }, documents: [], notifications: [] };
  }
}

function mediaToRow(item) {
  const now = item.updated_at || item.created_at || new Date().toISOString();
  return {
    id: item.id,
    site_slug: item.site_slug || 'aamihe',
    title: item.title || 'Sem título',
    url: item.url,
    category: item.category || 'imagens',
    subcategory: item.subcategory || 'Upload',
    mime_type: item.mime_type || 'application/octet-stream',
    size: item.size ?? null,
    source: item.source || 'upload',
    source_id: item.source_id ?? null,
    published: item.published !== false,
    catalog_key: item.catalog_key || item.url,
    storage_path: item.storage_path ?? null,
    created_at: item.created_at || now,
    updated_at: now,
  };
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
const legacy = await loadLegacyDashboard();

let notifs = [];
try {
  notifs = JSON.parse(readFileSync(path.join(root, 'aamihe_notifications.json'), 'utf8'));
} catch {
  notifs = legacy.notifications ?? [];
}

const media = legacy.media ?? [];
const documents = legacy.documents ?? [];
const emailDays = legacy.emailSendLog?.days ?? {};

if (media.length) {
  const { error } = await admin.from('site_media').upsert(media.map(mediaToRow), { onConflict: 'id' });
  if (error) {
    console.error('Erro site_media:', error.message);
    process.exit(1);
  }
  console.log(`✓ ${media.length} entradas → site_media`);
}

if (documents.length) {
  const { error } = await admin.from('aamihe_documents').upsert(documents.map(docToRow), { onConflict: 'id' });
  if (error) {
    console.error('Erro aamihe_documents:', error.message);
    process.exit(1);
  }
  console.log(`✓ ${documents.length} documentos → aamihe_documents`);
}

if (notifs.length) {
  const docIds = new Set(documents.map((d) => d.id));
  if (documents.length) {
    const { data: existingDocs } = await admin.from('aamihe_documents').select('id');
    for (const row of existingDocs ?? []) {
      if (row?.id) docIds.add(row.id);
    }
  }

  let skippedFk = 0;
  const rows = notifs.map((n) => {
    const docId = n.document_id?.trim() || null;
    const validDocId = docId && docIds.has(docId) ? docId : null;
    if (docId && !validDocId) skippedFk += 1;
    return {
      id: n.id,
      user_id: n.user_id,
      document_id: validDocId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: Boolean(n.read),
      created_at: n.created_at ?? new Date().toISOString(),
    };
  });

  const { error } = await admin.from('aamihe_subscriber_notifications').upsert(rows, {
    onConflict: 'id',
  });
  if (error) {
    console.error('Erro notificações:', error.message);
    console.error('Confirme que correu aamihe-documents-notifications.sql no Postgres.');
    process.exit(1);
  }
  console.log(
    `✓ ${rows.length} notificações → aamihe_subscriber_notifications` +
      (skippedFk ? ` (${skippedFk} sem documento correspondente — document_id=null)` : ''),
  );
}

const emailRows = Object.entries(emailDays).map(([date_key, send_count]) => ({
  date_key,
  send_count: Number(send_count) || 0,
  updated_at: new Date().toISOString(),
}));
if (emailRows.length) {
  const { error } = await admin.from('aamihe_email_daily_log').upsert(emailRows, { onConflict: 'date_key' });
  if (error) {
    console.error('Erro email quota:', error.message);
    console.error('Confirme que correu aamihe-email-quota.sql no Postgres.');
    process.exit(1);
  }
  console.log(`✓ ${emailRows.length} dias → aamihe_email_daily_log`);
}

await admin
  .from('site_content')
  .update({ documents: [], updated_at: new Date().toISOString() })
  .eq('site_slug', 'aamihe');

console.log('');
console.log('Migração concluída. Remova BLOB_READ_WRITE_TOKEN do .env — o site usa só Supabase Hetzner.');
