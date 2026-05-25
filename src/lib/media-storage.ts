import { mkdir, writeFile, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

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
      access: 'public',
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
      access: 'public',
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
    return sourceUrl;
  }

  const ext = path.extname(sourcePath) || '.jpg';
  const filename = newsImageFilename(path.basename(sourcePath) || title);
  const finalName = path.extname(filename) ? filename : `${filename}${ext}`;
  const destPath = path.join(publicRoot, 'gallery', finalName);
  await mkdir(path.dirname(destPath), { recursive: true });
  await copyFile(sourcePath, destPath);
  return `/gallery/${finalName}`;
}
