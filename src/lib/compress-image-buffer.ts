import path from 'node:path';

/** Nenhuma imagem guardada no servidor deve exceder 1 MB. */
export const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1920;

const COMPRESSIBLE = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
]);

export function isCompressibleImageMime(mimeType: string): boolean {
  return COMPRESSIBLE.has(mimeType.toLowerCase());
}

export type CompressedImage = {
  buffer: Buffer;
  mimeType: string;
  ext: string;
};

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    return null;
  }
}

export async function compressImageBuffer(
  input: Buffer,
  mimeType: string,
  originalName = 'image.jpg',
): Promise<CompressedImage> {
  const normalizedMime = mimeType.toLowerCase();

  if (!isCompressibleImageMime(normalizedMime)) {
    if (input.length > MAX_IMAGE_BYTES) {
      throw new Error(
        `O ficheiro excede 1 MB (${(input.length / 1024 / 1024).toFixed(1)} MB). Use JPEG ou PNG mais pequeno.`,
      );
    }
    return {
      buffer: input,
      mimeType: normalizedMime,
      ext: path.extname(originalName) || '',
    };
  }

  const sharpModule = await loadSharp();
  if (!sharpModule) {
    if (input.length > MAX_IMAGE_BYTES) {
      throw new Error('Imagem demasiado grande (máx. 1 MB). Comprima no computador antes de enviar.');
    }
    return {
      buffer: input,
      mimeType: normalizedMime,
      ext: path.extname(originalName) || '.jpg',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharp = sharpModule as any;
  let pipeline: any = sharp(input, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();

  if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  let quality = 82;
  let buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

  while (buffer.length > MAX_IMAGE_BYTES && quality > 42) {
    quality -= 10;
    buffer = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    buffer = await sharp(buffer)
      .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 68, mozjpeg: true })
      .toBuffer();
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Não foi possível reduzir a imagem abaixo de 1 MB. Escolha outra foto.');
  }

  return {
    buffer,
    mimeType: 'image/jpeg',
    ext: '.jpg',
  };
}

export function applyCompressedFileName(originalName: string, ext: string): string {
  const base = path.basename(originalName, path.extname(originalName)) || 'image';
  return `${base}${ext}`;
}
