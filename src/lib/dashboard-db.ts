import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SiteDocumentRecord } from '@/lib/site-documents';
import type { SiteMediaRecord } from '@/lib/site-media';
import type { SubscriberNotification } from '@/lib/subscriber-notifications';
import { BLOB_ACCESS } from '@/lib/blob-access';
import {
  getNotificationsList,
  invalidateNotificationsCache,
  saveNotificationsList,
} from '@/lib/dashboard-notifications-store';

export type DashboardDb = {
  documents: SiteDocumentRecord[];
  media: SiteMediaRecord[];
  notifications?: SubscriberNotification[];
  emailSendLog?: { days: Record<string, number> };
};

const LOCAL_PATH = path.join(process.cwd(), 'aamihe_dashboard.json');
const BLOB_PATH = 'aamihe/dashboard.json';

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const EMPTY_DB: DashboardDb = { documents: [], media: [], notifications: [] };
const DASHBOARD_DB_CACHE_MS = 30_000;

let dashboardDbCache: { data: DashboardDb; at: number } | null = null;
let dashboardDbInflight: Promise<DashboardDb> | null = null;

function cloneDashboardDb(db: DashboardDb): DashboardDb {
  return {
    documents: db.documents,
    media: db.media,
    notifications: db.notifications,
  };
}

async function loadDashboardDb(): Promise<DashboardDb> {
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
      notifications: parsed.notifications ?? [],
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

async function readDashboardFromBlob(): Promise<DashboardDb | null> {
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATH, { access: BLOB_ACCESS });
    if (!result?.stream) return null;
    const parsed = JSON.parse(await new Response(result.stream).text()) as Partial<DashboardDb>;
    return {
      documents: parsed.documents ?? [],
      media: parsed.media ?? [],
      notifications: parsed.notifications ?? [],
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

async function hydrateDashboardDb(data: DashboardDb): Promise<DashboardDb> {
  const fromStore = await getNotificationsList();
  if (fromStore.length > 0) {
    data.notifications = fromStore;
    return data;
  }
  if (data.notifications?.length) {
    await saveNotificationsList(data.notifications);
    return data;
  }
  data.notifications = [];
  return data;
}

export async function getDashboardDb(): Promise<DashboardDb> {
  if (dashboardDbCache && Date.now() - dashboardDbCache.at < DASHBOARD_DB_CACHE_MS) {
    return cloneDashboardDb(dashboardDbCache.data);
  }

  if (!dashboardDbInflight) {
    dashboardDbInflight = loadDashboardDb()
      .then(hydrateDashboardDb)
      .then((data) => {
        dashboardDbCache = { data, at: Date.now() };
        return cloneDashboardDb(data);
      })
      .finally(() => {
        dashboardDbInflight = null;
      });
  }

  return dashboardDbInflight;
}

export async function saveDashboardDb(db: DashboardDb): Promise<void> {
  dashboardDbCache = null;
  invalidateNotificationsCache();

  if (db.notifications?.length) {
    await saveNotificationsList(db.notifications);
  }

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
