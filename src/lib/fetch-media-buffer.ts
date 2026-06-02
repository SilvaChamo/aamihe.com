import { readFile } from 'node:fs/promises';
import path from 'node:path';

function mimeFromUrl(url: string): string {
  const ext = path.extname(url).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

/** Obtém bytes da imagem no servidor (evita canvas «tainted» no browser). */
export async function fetchMediaBuffer(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('URL em falta');
  }

  if (trimmed.startsWith('/')) {
    const relative = trimmed.replace(/^\//, '');
    const localPath = path.join(process.cwd(), 'public', relative);
    const buffer = await readFile(localPath);
    return { buffer, mimeType: mimeFromUrl(trimmed) };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('URL inválida');
  }

  const res = await fetch(trimmed, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Não foi possível transferir a imagem (${res.status})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get('content-type')?.split(';')[0]?.trim() || mimeFromUrl(trimmed);
  return { buffer, mimeType };
}
