import { mkdir, writeFile, copyFile, access, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { resolveMissingPublicImage } from '@/lib/reference-image-sync';
import { BLOB_ACCESS } from '@/lib/blob-access';

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function newsImageFilename(originalName: string): string {
  const ext = path.extname(originalName) || '.jpg';
  return `news-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

export async function storeImageBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ url: string; filename: string }> {
  const filename = newsImageFilename(originalName);

  if (hasBlobStorage()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`gallery/${filename}`, buffer, {
      access: BLOB_ACCESS,
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return { url: blob.url, filename };
  }

  const dir = path.join(process.cwd(), 'public', 'gallery');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/gallery/${filename}`, filename };
}

export async function storeUploadBuffer(
  buffer: Buffer,
  originalName: string,
  subfolder: string,
  mimeType: string
): Promise<{ url: string; filename: string }> {
  const ext = path.extname(originalName) || '';
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

  if (hasBlobStorage()) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`${subfolder}/${filename}`, buffer, {
      access: BLOB_ACCESS,
      contentType: mimeType,
      addRandomSuffix: false,
    });
    return { url: blob.url, filename };
  }

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

/** Remove ficheiro no Vercel Blob (produção). */
export async function deleteBlobFile(url: string): Promise<boolean> {
  if (!hasBlobStorage() || !isVercelBlobUrl(url)) return false;
  try {
    const { del } = await import('@vercel/blob');
    await del(url);
    return true;
  } catch (error) {
    console.error('deleteBlobFile:', url, error);
    return false;
  }
}

/** Remove ficheiro em public/ (ex.: /gallery/foto.jpg). */
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
