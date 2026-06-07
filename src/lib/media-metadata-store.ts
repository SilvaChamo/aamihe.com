import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { SiteMediaRecord } from '@/lib/site-media';

export type StoredMediaMetadata = {
  title?: string;
  alt_text?: string;
  caption?: string;
  description?: string;
  updated_at?: string;
};

type MetadataStore = Record<string, StoredMediaMetadata>;

const STORE_PATH = path.join(process.cwd(), 'src/data/media-metadata.json');

let cachedStore: MetadataStore | null = null;

async function ensureStoreDir() {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<MetadataStore> {
  if (cachedStore) return cachedStore;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as MetadataStore;
    cachedStore = parsed && typeof parsed === 'object' ? parsed : {};
    return cachedStore;
  } catch {
    cachedStore = {};
    return cachedStore;
  }
}

async function writeStore(store: MetadataStore) {
  cachedStore = store;
  await ensureStoreDir();
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function mergeStored(record: SiteMediaRecord, stored?: StoredMediaMetadata): SiteMediaRecord {
  if (!stored) return record;
  return {
    ...record,
    title: stored.title?.trim() || record.title,
    alt_text: stored.alt_text ?? record.alt_text,
    caption: stored.caption ?? record.caption,
    description: stored.description ?? record.description,
  };
}

export function invalidateMediaMetadataCache() {
  cachedStore = null;
}

export async function saveMediaMetadata(
  id: string,
  url: string,
  data: StoredMediaMetadata,
): Promise<StoredMediaMetadata> {
  const store = await readStore();
  const next: StoredMediaMetadata = {
    ...store[id],
    ...data,
    updated_at: new Date().toISOString(),
  };

  store[id] = next;
  const urlKey = url.trim().toLowerCase();
  if (urlKey.startsWith('/')) {
    store[urlKey] = next;
  }

  await writeStore(store);
  return next;
}

export async function enrichMediaRecords(records: SiteMediaRecord[]): Promise<SiteMediaRecord[]> {
  const store = await readStore();
  return records.map((record) => {
    const byId = store[record.id];
    const byUrl = record.url ? store[record.url.toLowerCase()] : undefined;
    return mergeStored(record, byId || byUrl);
  });
}
