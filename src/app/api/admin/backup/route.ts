import { NextResponse } from 'next/server';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { requireAdminAuth } from '@/lib/admin-session';
import { getSupabaseAdmin, isSupabaseConfigured, MEDIA_BUCKET } from '@/lib/supabase/server';

type StorageBackupFile = {
  path: string;
  contentType: string;
  dataBase64: string;
};

type StorageBackupBucket = {
  bucket: string;
  files: StorageBackupFile[];
};

type SiteBackupPayload = {
  version: 1;
  createdAt: string;
  siteContentRows: Record<string, unknown>[];
  siteMediaRows: Record<string, unknown>[];
  documentRows: Record<string, unknown>[];
  notificationRows: Record<string, unknown>[];
  emailDailyLogRows: Record<string, unknown>[];
  usersDb: Record<string, unknown>;
  storage: StorageBackupBucket[];
};

const BACKUP_BUCKET = 'aamihe-backups';
const BACKUP_PREFIX = 'full-site';
const PROFILES_TABLE = 'aamihe_user_profiles';

function authHeaders(contentType = 'application/json') {
  return { 'Content-Type': contentType };
}

async function ensureBucketExists(bucket: string) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado');

  const { data: existing, error: getError } = await admin.storage.getBucket(bucket);
  if (!getError && existing) return;

  const { error: createError } = await admin.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: '500MB',
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message);
  }
}

async function listAllPaths(bucket: string, dir = ''): Promise<string[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];

  const files: string[] = [];
  for (const item of data) {
    const itemPath = dir ? `${dir}/${item.name}` : item.name;
    const isFolder = !item.metadata;
    if (isFolder) {
      files.push(...(await listAllPaths(bucket, itemPath)));
    } else {
      files.push(itemPath);
    }
  }
  return files;
}

async function readStorageBucket(bucket: string): Promise<StorageBackupBucket> {
  const admin = getSupabaseAdmin();
  if (!admin) return { bucket, files: [] };

  const paths = await listAllPaths(bucket);
  const files: StorageBackupFile[] = [];

  for (const filePath of paths) {
    const { data } = await admin.storage.from(bucket).download(filePath);
    if (!data) continue;
    const buffer = Buffer.from(await data.arrayBuffer());
    files.push({
      path: filePath,
      contentType: data.type || 'application/octet-stream',
      dataBase64: buffer.toString('base64'),
    });
  }

  return { bucket, files };
}

async function buildBackupPayload(): Promise<SiteBackupPayload> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) {
    throw new Error('Supabase não configurado.');
  }

  const [
    { data: contentRows },
    { data: mediaRows },
    { data: profileRows },
    { data: documentRows },
    { data: notificationRows },
    { data: emailDailyLogRows },
  ] = await Promise.all([
    admin.from('site_content').select('*'),
    admin.from('site_media').select('*'),
    admin.from(PROFILES_TABLE).select('*'),
    admin.from('aamihe_documents').select('*'),
    admin.from('aamihe_subscriber_notifications').select('*'),
    admin.from('aamihe_email_daily_log').select('*'),
  ]);

  const usersDb = { users: profileRows ?? [] };
  const [mediaStorage, avatarStorage] = await Promise.all([
    readStorageBucket(MEDIA_BUCKET),
    readStorageBucket('avatars'),
  ]);

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    siteContentRows: (contentRows ?? []) as Record<string, unknown>[],
    siteMediaRows: (mediaRows ?? []) as Record<string, unknown>[],
    documentRows: (documentRows ?? []) as Record<string, unknown>[],
    notificationRows: (notificationRows ?? []) as Record<string, unknown>[],
    emailDailyLogRows: (emailDailyLogRows ?? []) as Record<string, unknown>[],
    usersDb,
    storage: [mediaStorage, avatarStorage],
  };
}

async function saveBackupInStorage(payload: SiteBackupPayload) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado');

  await ensureBucketExists(BACKUP_BUCKET);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${BACKUP_PREFIX}/${stamp}.json`;
  const body = Buffer.from(JSON.stringify(payload));
  const { error } = await admin.storage.from(BACKUP_BUCKET).upload(backupPath, body, {
    contentType: 'application/json',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { backupPath, sizeBytes: body.byteLength, createdAt: payload.createdAt };
}

async function loadBackupPayload(backupPath: string): Promise<SiteBackupPayload> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado');

  const { data, error } = await admin.storage.from(BACKUP_BUCKET).download(backupPath);
  if (error || !data) throw new Error(error?.message || 'Backup não encontrado');

  const raw = await data.text();
  const parsed = JSON.parse(raw) as SiteBackupPayload;
  if (!parsed || parsed.version !== 1) throw new Error('Formato de backup inválido');
  return parsed;
}

async function clearBucket(bucket: string) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const paths = await listAllPaths(bucket);
  if (paths.length === 0) return;
  await admin.storage.from(bucket).remove(paths);
}

async function restoreStorage(storage: StorageBackupBucket[]) {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase não configurado');

  for (const entry of storage) {
    await ensureBucketExists(entry.bucket);
    await clearBucket(entry.bucket);

    for (const file of entry.files) {
      const bin = Buffer.from(file.dataBase64, 'base64');
      const { error } = await admin.storage.from(entry.bucket).upload(file.path, bin, {
        contentType: file.contentType || 'application/octet-stream',
        upsert: true,
      });
      if (error) throw new Error(`Falha ao restaurar ficheiro ${file.path}: ${error.message}`);
    }
  }
}

async function restoreBackupPayload(payload: SiteBackupPayload) {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) throw new Error('Supabase não configurado');

  await admin.from('site_media').delete().neq('id', '');
  await admin.from('site_content').delete().neq('site_slug', '');
  await admin.from('aamihe_documents').delete().neq('id', '');
  await admin.from('aamihe_subscriber_notifications').delete().neq('id', '');
  await admin.from('aamihe_email_daily_log').delete().neq('date_key', '1970-01-01');

  if (payload.siteContentRows.length > 0) {
    const { error } = await admin.from('site_content').insert(payload.siteContentRows);
    if (error) throw new Error(`Erro ao restaurar conteúdo do site: ${error.message}`);
  }

  if (payload.siteMediaRows.length > 0) {
    const { error } = await admin.from('site_media').insert(payload.siteMediaRows);
    if (error) throw new Error(`Erro ao restaurar media: ${error.message}`);
  }

  if (payload.documentRows?.length) {
    const { error } = await admin.from('aamihe_documents').insert(payload.documentRows);
    if (error) throw new Error(`Erro ao restaurar documentos: ${error.message}`);
  }

  if (payload.notificationRows?.length) {
    const { error } = await admin.from('aamihe_subscriber_notifications').insert(payload.notificationRows);
    if (error) throw new Error(`Erro ao restaurar notificações: ${error.message}`);
  }

  if (payload.emailDailyLogRows?.length) {
    const { error } = await admin.from('aamihe_email_daily_log').insert(payload.emailDailyLogRows);
    if (error) throw new Error(`Erro ao restaurar quota de e-mail: ${error.message}`);
  }

  const legacyDashboard = (payload as { dashboardDb?: { emailSendLog?: { days?: Record<string, number> } } })
    .dashboardDb;
  if (legacyDashboard?.emailSendLog?.days) {
    const rows = Object.entries(legacyDashboard.emailSendLog.days).map(([date_key, send_count]) => ({
      date_key,
      send_count,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      await admin.from('aamihe_email_daily_log').upsert(rows, { onConflict: 'date_key' });
    }
  }

  if (Array.isArray(payload.usersDb?.users) && payload.usersDb.users.length > 0) {
    const { error } = await admin.from(PROFILES_TABLE).upsert(payload.usersDb.users, { onConflict: 'id' });
    if (error) throw new Error(`Erro ao restaurar perfis: ${error.message}`);
  }
  await restoreStorage(payload.storage ?? []);
}

export async function GET(request: Request) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const { searchParams } = new URL(request.url);
  const backupPath = searchParams.get('path');
  if (!backupPath) {
    return NextResponse.json({ error: 'Caminho do backup é obrigatório.' }, { status: 400 });
  }

  try {
    const payload = await loadBackupPayload(backupPath);
    return new NextResponse(JSON.stringify(payload), {
      headers: {
        ...authHeaders('application/json'),
        'Content-Disposition': `attachment; filename="${path.basename(backupPath)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao baixar backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = await requireAdminAuth(request);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const action = String(body.action || '');

  try {
    if (action === 'create') {
      const payload = await buildBackupPayload();
      const saved = await saveBackupInStorage(payload);
      return NextResponse.json({
        success: true,
        backup: {
          id: saved.backupPath,
          date: saved.createdAt,
          size: `${Math.max(1, Math.round(saved.sizeBytes / 1024))} KB`,
          type: 'Manual',
          storagePath: saved.backupPath,
        },
      });
    }

    if (action === 'restore') {
      let payload: SiteBackupPayload | null = null;
      const backupPath = body.path ? String(body.path) : '';
      if (backupPath) {
        payload = await loadBackupPayload(backupPath);
      } else if (body.payload && typeof body.payload === 'object') {
        payload = body.payload as SiteBackupPayload;
      }

      if (!payload) {
        return NextResponse.json({ error: 'Backup para restauração não encontrado.' }, { status: 400 });
      }

      await restoreBackupPayload(payload);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const backupPath = String(body.path || '');
      if (!backupPath) {
        return NextResponse.json({ error: 'Caminho do backup é obrigatório.' }, { status: 400 });
      }
      const admin = getSupabaseAdmin();
      if (!admin) {
        return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 500 });
      }
      const { error } = await admin.storage.from(BACKUP_BUCKET).remove([backupPath]);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno no backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
