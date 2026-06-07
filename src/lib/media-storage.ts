import { mkdir, writeFile, copyFile, access, unlink, rename, readdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { resolveMissingPublicImage } from '@/lib/reference-image-sync';

export function newsImageFilename(originalName: string): string {
  const ext = path.extname(originalName) || '.jpg';
  return `news-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

function extFromMime(mimeType: string, fallbackName: string): string {
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/gif') return '.gif';
  return path.extname(fallbackName) || '.jpg';
}

function galleryStorageFilename(originalName: string, mimeType: string, subcategory: string): string {
  const ext = extFromMime(mimeType, originalName);
  if (subcategory === 'Notícias') return newsImageFilename(originalName);

  const stem = path.basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);

  if (stem.includes('_edited_')) return `${stem}${ext}`;
  return `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

/** Guarda imagem em public/gallery (fonte única da galeria do site). */
export async function storeGalleryBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  subcategory = 'Galeria',
): Promise<{ url: string; filename: string }> {
  const filename = galleryStorageFilename(originalName, mimeType, subcategory);
  const dir = path.join(process.cwd(), 'public', 'gallery');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/gallery/${filename}`, filename };
}

/** @deprecated Use storeGalleryBuffer */
export async function storeImageBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ url: string; filename: string }> {
  return storeGalleryBuffer(buffer, originalName, mimeType, 'Notícias');
}

export async function storeUploadBuffer(
  buffer: Buffer,
  originalName: string,
  subfolder: string,
  mimeType: string,
): Promise<{ url: string; filename: string }> {
  const ext = path.extname(originalName) || '';
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const dir = path.join(process.cwd(), 'public', subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/${subfolder}/${filename}`, filename };
}

export function isVercelBlobUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.endsWith('.public.blob.vercel-storage.com') || host.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

/** URLs antigas no Vercel Blob — registo removido da BD; ficheiro pode já não existir. */
export async function deleteBlobFile(_url: string): Promise<boolean> {
  return false;
}

export async function deleteLocalPublicFile(url: string): Promise<boolean> {
  if (!url.startsWith('/')) return false;

  const relative = url.replace(/^\//, '');
  const filePath = path.join(process.cwd(), 'public', relative);

  try {
    await unlink(filePath);
    return true;
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code === 'ENOENT') return true;
    console.error('deleteLocalPublicFile:', filePath, error);
    return false;
  }
}

export function publicUrlToFilePath(url: string): string | null {
  if (!url.startsWith('/')) return null;
  return path.join(process.cwd(), 'public', url.replace(/^\//, ''));
}

async function findFileByBasename(dir: string, basename: string, publicRel = ''): Promise<string | null> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const target = basename.toLowerCase();
  for (const entry of entries) {
    if (entry.name === '.trash') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = publicRel ? `${publicRel}/${entry.name}` : entry.name;
      const hit = await findFileByBasename(full, basename, rel);
      if (hit) return hit;
      continue;
    }
    if (entry.name.toLowerCase() === target) {
      return full;
    }
  }
  return null;
}

/** Localiza ficheiro público pelo URL exacto ou pelo nome do ficheiro. */
export async function findLocalPublicFile(
  url: string,
): Promise<{ filePath: string; publicUrl: string } | null> {
  const normalized = url.trim();
  if (!normalized.startsWith('/')) return null;

  const direct = publicUrlToFilePath(normalized);
  if (direct) {
    try {
      await access(direct);
      return { filePath: direct, publicUrl: normalized };
    } catch {
      /* tentar basename */
    }
  }

  const basename = path.basename(normalized);
  const searchRoots = [
    path.join(process.cwd(), 'public', 'gallery'),
    path.join(process.cwd(), 'public', 'uploads'),
  ];

  for (const root of searchRoots) {
    const found = await findFileByBasename(root, basename);
    if (!found) continue;
    const rel = path.relative(path.join(process.cwd(), 'public'), found).replace(/\\/g, '/');
    return { filePath: found, publicUrl: `/${rel}` };
  }

  return null;
}

/** Move ficheiro público para public/gallery/.trash (reciclagem). */
export async function movePublicFileToTrash(url: string): Promise<{ trashUrl: string } | null> {
  const located = await findLocalPublicFile(url);
  if (!located) return null;

  const basename = path.basename(located.filePath);
  const trashRelative = path.join('gallery', '.trash', `${Date.now()}-${basename}`);
  const trashPath = path.join(process.cwd(), 'public', trashRelative);

  await mkdir(path.dirname(trashPath), { recursive: true });
  await rename(located.filePath, trashPath);
  return { trashUrl: `/${trashRelative.replace(/\\/g, '/')}` };
}

/** Restaura ficheiro da reciclagem para o URL original. */
export async function restorePublicFileFromTrash(
  trashUrl: string,
  originalUrl: string,
): Promise<string | null> {
  const trashPath = publicUrlToFilePath(trashUrl);
  const destPath = publicUrlToFilePath(originalUrl);
  if (!trashPath || !destPath) return null;

  try {
    await access(trashPath);
  } catch {
    try {
      await access(destPath);
      return originalUrl;
    } catch {
      return null;
    }
  }

  await mkdir(path.dirname(destPath), { recursive: true });
  await rename(trashPath, destPath);
  return originalUrl;
}

export async function ensureGalleryFile(sourceUrl: string, title: string): Promise<string> {
  if (sourceUrl.startsWith('http')) {
    return sourceUrl;
  }

  if (!sourceUrl.startsWith('/gallery/') && sourceUrl.startsWith('/')) {
    return copyToGallery(sourceUrl, title);
  }

  return sourceUrl;
}

async function copyToGallery(sourceUrl: string, title: string): Promise<string> {
  const publicRoot = path.join(process.cwd(), 'public');
  const sourcePath = path.join(publicRoot, sourceUrl.replace(/^\//, ''));

  try {
    await access(sourcePath);
  } catch {
    const basename = path.basename(sourcePath);
    return resolveMissingPublicImage(`/gallery/${basename}`);
  }

  const ext = path.extname(sourcePath) || '.jpg';
  const filename = newsImageFilename(path.basename(sourcePath) || title);
  const finalName = path.extname(filename) ? filename : `${filename}${ext}`;
  const destPath = path.join(publicRoot, 'gallery', finalName);
  await mkdir(path.dirname(destPath), { recursive: true });
  await copyFile(sourcePath, destPath);
  return `/gallery/${finalName}`;
}
