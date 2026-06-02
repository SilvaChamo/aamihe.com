import path from 'node:path';
import { applyCompressedFileName } from '@/lib/compress-image-buffer';

export type ImageEditFormat = 'original' | 'webp' | 'jpeg';

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    return null;
  }
}

export async function resizeImageBuffer(
  input: Buffer,
  width: number,
  height: number,
  format: ImageEditFormat,
  sourceMime: string,
  originalName: string,
): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
  const targetW = Math.max(1, Math.round(width));
  const targetH = Math.max(1, Math.round(height));
  const sharpModule = await loadSharp();

  if (!sharpModule) {
    throw new Error('Processamento de imagem indisponível no servidor.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharp = sharpModule as any;
  let pipeline = sharp(input, { failOn: 'none' }).rotate().resize({
    width: targetW,
    height: targetH,
    fit: 'fill',
  });

  let mimeType = sourceMime;
  let ext = path.extname(originalName) || '.jpg';

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality: 85 });
    mimeType = 'image/webp';
    ext = '.webp';
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
    mimeType = 'image/jpeg';
    ext = '.jpg';
  } else if (sourceMime.toLowerCase().includes('png')) {
    pipeline = pipeline.png();
    mimeType = 'image/png';
    ext = '.png';
  } else {
    pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
    mimeType = 'image/jpeg';
    ext = '.jpg';
  }

  const buffer = await pipeline.toBuffer();
  const name = applyCompressedFileName(originalName, ext);

  return { buffer, mimeType, name };
}
