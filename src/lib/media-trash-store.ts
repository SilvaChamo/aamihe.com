import { execFile } from 'node:child_process';
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mediaUniqueBasename } from '@/lib/media-catalog-key';
import type { StoredMediaMetadata } from '@/lib/media-metadata-store';
import { publicUrlToFilePath } from '@/lib/media-storage';

const execFileAsync = promisify(execFile);

export type TrashedMediaRecord = {
  id: string;
  url: string;
  trash_path: string;
  title: string;
  mime_type?: string;
  size?: number;
  subcategory?: string;
  category?: string;
  source?: string;
  metadata?: StoredMediaMetadata;
  deleted_at: string;
};

type TrashStore = Record<string, TrashedMediaRecord>;

const STORE_PATH = path.join(process.cwd(), 'src/data/media-trash.json');
const GALLERY_URLS_PATH = path.join(process.cwd(), 'src/data/gallery-urls.json');
const TRASH_DIR = path.join(process.cwd(), 'public', 'gallery', '.trash');

let cachedStore: TrashStore | null = null;

function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTrashFilename(name: string): { deletedAt: string; originalBasename: string } {
  const match = name.match(/^(\d{13})-(.+)$/);
  if (!match) {
    return { deletedAt: new Date().toISOString(), originalBasename: name };
  }
  return {
    deletedAt: new Date(Number(match[1])).toISOString(),
    originalBasename: match[2],
  };
}

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function subcategoryFor(url: string): string {
  if (url.includes('/paises/')) return 'Países membros';
  if (url.includes('/flags/')) return 'Site';
  return 'Galeria';
}

async function fileExists(url: string): Promise<boolean> {
  const filePath = publicUrlToFilePath(url);
  if (!filePath) return false;
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadKnownGalleryUrls(): Promise<string[]> {
  try {
    const raw = await readFile(GALLERY_URLS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.startsWith('/'));
  } catch {
    return [];
  }
}

async function gitShowFile(gitPath: string): Promise<Buffer | null> {
  try {
    const { stdout } = await execFileAsync('git', ['show', `HEAD:${gitPath}`], {
      encoding: 'buffer',
      maxBuffer: 20 * 1024 * 1024,
    });
    return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
  } catch {
    return null;
  }
}

function trashBasenameSet(entries: string[]): Set<string> {
  const basenames = new Set<string>();
  for (const name of entries) {
    const parsed = parseTrashFilename(name);
    basenames.add(parsed.originalBasename.toLowerCase());
    basenames.add(mediaUniqueBasename(parsed.originalBasename));
  }
  return basenames;
}

function inferOriginalUrl(originalBasename: string, knownUrls: string[]): string {
  const lower = originalBasename.toLowerCase();
  const unique = mediaUniqueBasename(originalBasename);

  const exactMatches = knownUrls.filter((url) => url.toLowerCase().endsWith(`/${lower}`));
  if (exactMatches.length > 0) {
    const paises = exactMatches.find((url) => url.includes('/paises/'));
    return paises || exactMatches[0];
  }

  const byUnique = knownUrls.filter((url) => mediaUniqueBasename(url) === unique);
  if (byUnique.length > 0) {
    const paises = byUnique.find((url) => url.includes('/paises/'));
    return paises || byUnique[0];
  }

  return `/gallery/${originalBasename}`;
}

async function recoverMissingFromGit(
  store: TrashStore,
  knownUrls: string[],
  trashEntries: string[],
): Promise<string[]> {
  const trashedBasenames = trashBasenameSet(trashEntries);
  const trashedUrls = new Set(Object.values(store).map((item) => item.url.toLowerCase()));
  const recovered: string[] = [];

  for (const url of knownUrls) {
    if (!url.startsWith('/gallery/')) continue;
    if (trashedUrls.has(url.toLowerCase())) continue;
    if (await fileExists(url)) continue;

    const basename = path.basename(url);
    const unique = mediaUniqueBasename(basename);
    if (trashedBasenames.has(basename.toLowerCase()) || trashedBasenames.has(unique)) {
      continue;
    }

    const gitPath = `public${url}`;
    const buffer = await gitShowFile(gitPath);
    if (!buffer || buffer.length === 0) continue;

    const trashName = `${Date.now()}-${basename}`;
    const trashPath = path.join(TRASH_DIR, trashName);
    await writeFile(trashPath, buffer);
    trashedBasenames.add(basename.toLowerCase());
    trashedBasenames.add(unique);
    recovered.push(trashName);
  }

  return recovered;
}

async function syncTrashFromFilesystem(store: TrashStore): Promise<boolean> {
  await mkdir(TRASH_DIR, { recursive: true });

  const knownUrls = await loadKnownGalleryUrls();
  let trashEntries: string[];
  try {
    trashEntries = await readdir(TRASH_DIR);
  } catch {
    trashEntries = [];
  }

  const knownTrashPaths = new Set(
    Object.values(store).map((item) => item.trash_path.toLowerCase()),
  );
  let changed = false;

  const recovered = await recoverMissingFromGit(store, knownUrls, trashEntries);
  if (recovered.length > 0) {
    changed = true;
    trashEntries = [...trashEntries, ...recovered];
  }

  for (const item of Object.values(store)) {
    const basename = path.basename(item.trash_path);
    const parsed = parseTrashFilename(basename);
    const betterUrl = inferOriginalUrl(parsed.originalBasename, knownUrls);
    if (betterUrl !== item.url) {
      item.url = betterUrl;
      item.subcategory = subcategoryFor(betterUrl);
      changed = true;
    }
  }

  for (const name of trashEntries) {
    const trash_path = `/gallery/.trash/${name}`;
    if (knownTrashPaths.has(trash_path.toLowerCase())) continue;

    const fullPath = path.join(TRASH_DIR, name);
    let fileStat;
    try {
      fileStat = await stat(fullPath);
    } catch {
      continue;
    }
    if (!fileStat.isFile()) continue;

    const parsed = parseTrashFilename(name);
    const originalUrl = inferOriginalUrl(parsed.originalBasename, knownUrls);
    const id = `trash_fs_${createHash('sha1').update(trash_path).digest('hex').slice(0, 12)}`;

    store[id] = {
      id,
      url: originalUrl,
      trash_path,
      title: titleFromFilename(parsed.originalBasename),
      mime_type: mimeFromName(parsed.originalBasename),
      size: fileStat.size,
      subcategory: subcategoryFor(originalUrl),
      category: 'imagens',
      source: 'legacy',
      deleted_at: parsed.deletedAt,
    };
    knownTrashPaths.add(trash_path.toLowerCase());
    changed = true;
  }

  return changed;
}

async function ensureStoreDir() {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<TrashStore> {
  if (cachedStore) return cachedStore;
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TrashStore;
    cachedStore = parsed && typeof parsed === 'object' ? parsed : {};
    return cachedStore;
  } catch {
    cachedStore = {};
    return cachedStore;
  }
}

async function writeStore(store: TrashStore) {
  cachedStore = store;
  await ensureStoreDir();
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

export function invalidateMediaTrashCache() {
  cachedStore = null;
}

export async function listTrashedMedia(): Promise<TrashedMediaRecord[]> {
  invalidateMediaTrashCache();
  const store = await readStore();
  const changed = await syncTrashFromFilesystem(store);
  if (changed) {
    await writeStore(store);
  }
  return Object.values(store).sort(
    (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime(),
  );
}

export async function getTrashedMedia(id: string): Promise<TrashedMediaRecord | null> {
  const store = await readStore();
  return store[id] ?? null;
}

export async function addTrashedMedia(item: TrashedMediaRecord): Promise<TrashedMediaRecord> {
  const store = await readStore();
  store[item.id] = item;
  await writeStore(store);
  return item;
}

export async function removeTrashedMedia(id: string): Promise<boolean> {
  const store = await readStore();
  if (!store[id]) return false;
  delete store[id];
  await writeStore(store);
  return true;
}
