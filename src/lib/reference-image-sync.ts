import { access, copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { mediaCatalogKey } from '@/lib/media-catalog-key';
import type { SiteMediaRecord } from '@/lib/site-media';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

function referenceRoots(): string[] {
  const candidates = [
    process.env.REFERENCE_SITE_PATH,
    path.join(process.cwd(), '../aamihe/site'),
    path.join(process.cwd(), '../aamihe'),
  ].filter((p): p is string => Boolean(p));

  return [...new Set(candidates)];
}

let referenceIndex: Map<string, string> | null = null;

function normalizeBasename(name: string): string {
  return name.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '').toLowerCase();
}

async function walkReferenceDir(dir: string, index: Map<string, string>) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkReferenceDir(full, index);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;

    const lower = entry.name.toLowerCase();
    const normalized = normalizeBasename(lower);
    if (!index.has(lower)) index.set(lower, full);
    if (!index.has(normalized)) index.set(normalized, full);
  }
}

export async function getReferenceIndex(): Promise<Map<string, string>> {
  if (referenceIndex) return referenceIndex;

  referenceIndex = new Map();
  for (const root of referenceRoots()) {
    await walkReferenceDir(root, referenceIndex);
  }
  return referenceIndex;
}

export async function publicFileExists(urlPath: string): Promise<boolean> {
  if (!urlPath.startsWith('/')) return false;
  try {
    await access(path.join(process.cwd(), 'public', urlPath.replace(/^\//, '')));
    return true;
  } catch {
    return false;
  }
}

export async function resolveMissingPublicImage(urlPath: string): Promise<string> {
  if (!urlPath.startsWith('/')) return urlPath;
  if (await publicFileExists(urlPath)) return urlPath;

  const filename = path.basename(urlPath);
  const index = await getReferenceIndex();
  const sourcePath =
    index.get(filename.toLowerCase()) ?? index.get(normalizeBasename(filename));

  if (!sourcePath) return urlPath;

  const destRel = urlPath.startsWith('/gallery/')
    ? urlPath
    : `/gallery/${filename}`;
  const destAbs = path.join(process.cwd(), 'public', destRel.replace(/^\//, ''));

  await mkdir(path.dirname(destAbs), { recursive: true });
  await copyFile(sourcePath, destAbs);
  return destRel;
}

export async function resolveMediaRecordFiles(records: SiteMediaRecord[]): Promise<SiteMediaRecord[]> {
  const resolved: SiteMediaRecord[] = [];

  for (const record of records) {
    if (record.category !== 'imagens') {
      resolved.push(record);
      continue;
    }

    if (record.url.startsWith('/')) {
      const url = await resolveMissingPublicImage(record.url);
      resolved.push(url === record.url ? record : { ...record, url, updated_at: new Date().toISOString() });
      continue;
    }

    resolved.push(record);
  }

  return resolved;
}

export async function collectUrlsFromReferenceHtml(): Promise<string[]> {
  const urls = new Set<string>();
  const htmlFiles = ['Galeria_de_fotos.htm', 'home-aamihe.html', 'Blog.html'];

  for (const root of referenceRoots()) {
    for (const name of htmlFiles) {
      const htmlPath = path.join(root, name);
      try {
        const html = await readFile(htmlPath, 'utf8');
        for (const match of html.matchAll(/(?:src|data-thumbnail|url\s*\(\s*["'])=["']?([^"')]+\.(?:jpg|jpeg|png|webp|gif)[^"')]*)/gi)) {
          let raw = match[1].trim();
          if (raw.startsWith('site/')) raw = `/${raw.replace(/^site\//, '')}`;
          if (raw.startsWith('/')) urls.add(raw.split('?')[0]);
          else if (raw.includes('wp-content/uploads')) urls.add(raw.split('?')[0]);
        }
      } catch {
        /* ficheiro opcional */
      }
    }
  }

  return Array.from(urls);
}

export function uniqueMediaIds(records: SiteMediaRecord[]): SiteMediaRecord[] {
  const byId = new Map<string, SiteMediaRecord>();

  for (const record of records) {
    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, record);
      continue;
    }
    const prefer =
      record.url.startsWith('/') && !existing.url.startsWith('/')
        ? record
        : existing.url.startsWith('/') && !record.url.startsWith('/')
          ? existing
          : record.updated_at > existing.updated_at
            ? record
            : existing;
    byId.set(record.id, prefer);
  }

  return Array.from(byId.values());
}

export function repairDuplicateIds(records: SiteMediaRecord[]): SiteMediaRecord[] {
  const seen = new Set<string>();
  return records.map((record) => {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      return record;
    }
    const newId = `${record.id}_${mediaCatalogKey(record.url).slice(0, 12)}`;
    seen.add(newId);
    return { ...record, id: newId };
  });
}
