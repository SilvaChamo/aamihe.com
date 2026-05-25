import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function saveUploadedBuffer(
  buffer: Buffer,
  originalName: string,
  subfolder = 'uploads'
): Promise<{ url: string; filename: string }> {
  const ext = path.extname(originalName) || '';
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const dir = path.join(process.cwd(), 'public', subfolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/${subfolder}/${filename}`, filename };
}
