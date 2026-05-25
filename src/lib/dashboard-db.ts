import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import type { SiteMediaRecord } from '@/lib/site-media';

export type DashboardDb = {
  documents: SiteDocumentRecord[];
  media: SiteMediaRecord[];
};

const DB_PATH = path.join(process.cwd(), 'aamihe_dashboard.json');

export async function getDashboardDb(): Promise<DashboardDb> {
  try {
    const raw = await readFile(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DashboardDb>;
    return {
      documents: parsed.documents ?? [],
      media: parsed.media ?? [],
    };
  } catch {
    return { documents: [], media: [] };
  }
}

export async function saveDashboardDb(db: DashboardDb): Promise<void> {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}
