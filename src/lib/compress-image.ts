const MAX_AVATAR_SIZE_BYTES = 100 * 1024;

async function renderCompressed(
  img: HTMLImageElement,
  sourceSize: number,
  sx: number,
  sy: number,
  finalSize: number,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = finalSize;
    canvas.height = finalSize;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, finalSize, finalSize);
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha na compressão'))),
      'image/jpeg',
      quality,
    );
  });
}

export async function compressAvatarImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        let finalSize = 400;
        const sourceSize = Math.min(img.width, img.height);
        let sx = (img.width - sourceSize) / 2;
        let sy = (img.height - sourceSize) / 2;
        if (img.height > img.width) sy = (img.height - sourceSize) * 0.15;
        try {
          let quality = 0.8;
          let blob = await renderCompressed(img, sourceSize, sx, sy, finalSize, quality);

          while (blob.size > MAX_AVATAR_SIZE_BYTES && quality > 0.35) {
            quality -= 0.1;
            blob = await renderCompressed(img, sourceSize, sx, sy, finalSize, quality);
          }

          while (blob.size > MAX_AVATAR_SIZE_BYTES && finalSize > 220) {
            finalSize -= 30;
            blob = await renderCompressed(img, sourceSize, sx, sy, finalSize, quality);
          }

          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
    };
    reader.onerror = reject;
  });
}
