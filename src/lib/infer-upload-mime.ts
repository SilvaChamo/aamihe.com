import path from 'node:path';

const EXT_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
};

export function inferUploadMimeType(file: { name: string; type?: string }): string {
  const fromClient = file.type?.trim();
  if (fromClient && fromClient !== 'application/octet-stream') {
    return fromClient;
  }
  const ext = path.extname(file.name).toLowerCase();
  return EXT_MIME[ext] || 'application/octet-stream';
}
