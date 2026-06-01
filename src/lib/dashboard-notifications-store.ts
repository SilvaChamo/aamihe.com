import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SubscriberNotification } from '@/lib/subscriber-notifications';
import { BLOB_ACCESS } from '@/lib/blob-access';

const BLOB_PATH = 'aamihe/notifications.json';
const DASHBOARD_BLOB_PATH = 'aamihe/dashboard.json';
const LOCAL_PATH = path.join(process.cwd(), 'aamihe_notifications.json');
const DASHBOARD_LOCAL_PATH = path.join(process.cwd(), 'aamihe_dashboard.json');
const CACHE_MS = 20_000;

let memoryCache: { data: SubscriberNotification[]; at: number } | null = null;
let loadInflight: Promise<SubscriberNotification[]> | null = null;

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readFromBlob(): Promise<SubscriberNotification[] | null> {
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATH, { access: BLOB_ACCESS });
    if (!result?.stream) return null;
    const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
    return Array.isArray(parsed) ? (parsed as SubscriberNotification[]) : [];
  } catch {
    return null;
  }
}

async function writeToBlob(notifications: SubscriberNotification[]): Promise<void> {
  const { put } = await import('@vercel/blob');
  await put(BLOB_PATH, JSON.stringify(notifications), {
    access: BLOB_ACCESS,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function readFromLocal(): Promise<SubscriberNotification[] | null> {
  try {
    const raw = await readFile(LOCAL_PATH, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SubscriberNotification[]) : [];
  } catch {
    return null;
  }
}

async function migrateFromDashboard(): Promise<SubscriberNotification[]> {
  try {
    if (hasBlobStorage()) {
      const { get } = await import('@vercel/blob');
      const result = await get(DASHBOARD_BLOB_PATH, { access: BLOB_ACCESS });
      if (result?.stream) {
        const parsed = JSON.parse(await new Response(result.stream).text()) as {
          notifications?: SubscriberNotification[];
        };
        const list = Array.isArray(parsed.notifications) ? parsed.notifications : [];
        if (list.length) {
          await saveNotificationsList(list);
          return list;
        }
      }
    }

    const raw = await readFile(DASHBOARD_LOCAL_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { notifications?: SubscriberNotification[] };
    const list = Array.isArray(parsed.notifications) ? parsed.notifications : [];
    if (list.length) {
      await saveNotificationsList(list);
      return list;
    }
  } catch {
    /* sem migração */
  }
  return [];
}

/** Carrega só notificações (ficheiro pequeno), sem o dashboard completo. */
async function loadNotificationsList(): Promise<SubscriberNotification[]> {
  if (hasBlobStorage()) {
    const fromBlob = await readFromBlob();
    if (fromBlob && fromBlob.length > 0) return fromBlob;
  }

  const fromLocal = await readFromLocal();
  if (fromLocal && fromLocal.length > 0) return fromLocal;

  return migrateFromDashboard();
}

export async function getNotificationsList(): Promise<SubscriberNotification[]> {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_MS) {
    return [...memoryCache.data];
  }

  if (!loadInflight) {
    loadInflight = loadNotificationsList()
      .then((data) => {
        memoryCache = { data, at: Date.now() };
        return data;
      })
      .finally(() => {
        loadInflight = null;
      });
  }

  return [...(await loadInflight)];
}

export async function saveNotificationsList(notifications: SubscriberNotification[]): Promise<void> {
  const trimmed = notifications.slice(0, 500);
  memoryCache = { data: trimmed, at: Date.now() };

  const json = JSON.stringify(trimmed);

  if (hasBlobStorage()) {
    await writeToBlob(trimmed);
  }

  try {
    await writeFile(LOCAL_PATH, json, 'utf8');
  } catch (err) {
    if (!hasBlobStorage()) throw err;
  }
}

export function invalidateNotificationsCache(): void {
  memoryCache = null;
}
