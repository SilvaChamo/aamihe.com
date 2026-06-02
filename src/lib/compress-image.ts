/** Imagens do site: máximo 1 MB. Avatares: máximo 100 KB. */
export const MAX_UPLOAD_IMAGE_BYTES = 1024 * 1024;
const MAX_AVATAR_SIZE_BYTES = 100 * 1024;
const MAX_UPLOAD_DIMENSION = 1920;

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') && file.type !== 'image/svg+xml' && file.type !== 'image/gif';
}

async function renderToJpegBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Falha na compressão'));
      return;
    }
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha na compressão'))),
      'image/jpeg',
      quality,
    );
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Imagem inválida'));
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro'));
  });
}

function fitDimensions(
  width: number,
  height: number,
  maxSide: number,
): { width: number; height: number } {
  if (width <= maxSide && height <= maxSide) {
    return { width, height };
  }
  const ratio = Math.min(maxSide / width, maxSide / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function compressToLimit(
  img: HTMLImageElement,
  maxBytes: number,
  maxDimension: number,
): Promise<Blob> {
  let { width, height } = fitDimensions(img.width, img.height, maxDimension);
  let quality = 0.85;
  let blob = await renderToJpegBlob(img, width, height, quality);

  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await renderToJpegBlob(img, width, height, quality);
  }

  while (blob.size > maxBytes && Math.max(width, height) > 480) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    blob = await renderToJpegBlob(img, width, height, quality);
  }

  if (blob.size > maxBytes) {
    throw new Error('Não foi possível reduzir a imagem abaixo do limite. Escolha outra foto.');
  }

  return blob;
}

/** Fotos gerais (multimédia, notícias, etc.) — até 1 MB. */
export async function compressUploadImage(file: File): Promise<File> {
  if (!isImageFile(file)) {
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new Error('O ficheiro excede 1 MB.');
    }
    return file;
  }

  if (file.size <= MAX_UPLOAD_IMAGE_BYTES && file.type === 'image/jpeg') {
    const img = await loadImage(file);
    if (img.width <= MAX_UPLOAD_DIMENSION && img.height <= MAX_UPLOAD_DIMENSION) {
      return file;
    }
  }

  const img = await loadImage(file);
  const blob = await compressToLimit(img, MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_DIMENSION);
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}

export async function compressAvatarImage(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const sourceSize = Math.min(img.width, img.height);
  let sx = (img.width - sourceSize) / 2;
  let sy = (img.height - sourceSize) / 2;
  if (img.height > img.width) sy = (img.height - sourceSize) * 0.15;

  const canvas = document.createElement('canvas');
  let finalSize = 400;
  const draw = (size: number, quality: number) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Falha na compressão'))),
        'image/jpeg',
        quality,
      );
    });

  let quality = 0.8;
  let blob = await draw(finalSize, quality);
  while (blob.size > MAX_AVATAR_SIZE_BYTES && quality > 0.35) {
    quality -= 0.1;
    blob = await draw(finalSize, quality);
  }
  while (blob.size > MAX_AVATAR_SIZE_BYTES && finalSize > 220) {
    finalSize -= 30;
    blob = await draw(finalSize, quality);
  }
  return blob;
}
