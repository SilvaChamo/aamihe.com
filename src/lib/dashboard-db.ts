import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import type { SiteMediaRecord } from '@/lib/site-media';
import { BLOB_ACCESS } from '@/lib/blob-access';

export type DashboardDb = {
  documents: SiteDocumentRecord[];
  media: SiteMediaRecord[];
};

const LOCAL_PATH = path.join(process.cwd(), 'aamihe_dashboard.json');
const BLOB_PATH = 'aamihe/dashboard.json';

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const EMPTY_DB: DashboardDb = { documents: [], media: [] };

async function readDashboardFromBlob(): Promise<DashboardDb | null> {
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATH, { access: BLOB_ACCESS });
    if (!result?.stream) return null;
    const parsed = JSON.parse(await new Response(result.stream).text()) as Partial<DashboardDb>;
    return {
      documents: parsed.documents ?? [],
      media: parsed.media ?? [],
    };
  } catch {
    return null;
  }
}

async function writeDashboardToBlob(db: DashboardDb): Promise<void> {
  const { put } = await import('@vercel/blob');
  await put(BLOB_PATH, JSON.stringify(db, null, 2), {
    access: BLOB_ACCESS,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getDashboardDb(): Promise<DashboardDb> {
  if (hasBlobStorage()) {
    const fromBlob = await readDashboardFromBlob();
    if (fromBlob) return fromBlob;
  }

  try {
    const raw = await readFile(LOCAL_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DashboardDb>;
    return {
      documents: parsed.documents ?? [],
      media: parsed.media ?? [],
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

export async function saveDashboardDb(db: DashboardDb): Promise<void> {
  const json = JSON.stringify(db, null, 2);

  if (hasBlobStorage()) {
    await writeDashboardToBlob(db);
  }

  try {
    await writeFile(LOCAL_PATH, json, 'utf8');
  } catch (err) {
    if (!hasBlobStorage()) {
      throw err;
    }
  }
}
