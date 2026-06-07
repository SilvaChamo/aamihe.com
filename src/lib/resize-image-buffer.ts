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

function encodeQualityForScale(pixelRatio: number, format: ImageEditFormat, sourceMime: string): number {
  if (pixelRatio > 1.01) {
    return Math.min(96, Math.round(88 + (pixelRatio - 1) * 24));
  }
  if (pixelRatio < 0.99) {
    return Math.max(68, Math.round(88 - (1 - pixelRatio) * 28));
  }
  if (format === 'webp') return 85;
  if (format === 'jpeg') return 88;
  if (sourceMime.toLowerCase().includes('png')) return 100;
  return 88;
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
  const meta = await sharp(input, { failOn: 'none' }).metadata();
  const sourceW = Math.max(1, meta.width || targetW);
  const sourceH = Math.max(1, meta.height || targetH);
  const pixelRatio = (targetW * targetH) / (sourceW * sourceH);
  const isUpscale = pixelRatio > 1.01;
  const quality = encodeQualityForScale(pixelRatio, format, sourceMime);

  let pipeline = sharp(input, { failOn: 'none' }).rotate().resize({
    width: targetW,
    height: targetH,
    fit: 'fill',
    kernel: isUpscale ? 'lanczos3' : 'lanczos2',
  });

  let mimeType = sourceMime;
  let ext = path.extname(originalName) || '.jpg';

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality, effort: 4 });
    mimeType = 'image/webp';
    ext = '.webp';
  } else if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    mimeType = 'image/jpeg';
    ext = '.jpg';
  } else if (sourceMime.toLowerCase().includes('png')) {
    pipeline = pipeline.png({ compressionLevel: pixelRatio < 0.99 ? 8 : 6 });
    mimeType = 'image/png';
    ext = '.png';
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    mimeType = 'image/jpeg';
    ext = '.jpg';
  }

  const buffer = await pipeline.toBuffer();
  const name = applyCompressedFileName(originalName, ext);

  return { buffer, mimeType, name };
}
