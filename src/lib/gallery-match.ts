import path from 'node:path';

/** Normaliza nome de ficheiro para comparar variantes (webp, -300x200, -scaled, etc.). */
export function galleryFileStem(filePath: string): string {
  let name = path.basename(filePath).toLowerCase();
  name = name.replace(/\.(jpe?g|png|gif)\.webp$/i, '');
  name = name.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/gi, '');
  name = name.replace(/-scaled(?=\.[a-z0-9]+$)/gi, '');
  name = name.replace(/\.(jpe?g|png|gif|webp)$/i, '');
  name = name.replace(/-\d+$/, '');
  return name;
}

/** Escolhe o melhor URL em public/gallery para um caminho pedido. */
export function findBestGalleryUrl(requested: string, available: string[]): string | null {
  const trimmed = requested?.trim();
  if (!trimmed) return null;

  const normalized = trimmed.startsWith('/images/')
    ? trimmed.replace(/^\/images\//, '/gallery/')
    : trimmed.startsWith('/Imagens/')
      ? trimmed.replace(/^\/Imagens\//, '/gallery/')
      : trimmed;

  if (available.includes(normalized)) return normalized;

  const reqStem = galleryFileStem(normalized);
  if (!reqStem) return null;

  const candidates = available.filter((url) => {
    const stem = galleryFileStem(url);
    return stem === reqStem || stem.startsWith(reqStem) || reqStem.startsWith(stem);
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aStem = galleryFileStem(a);
    const bStem = galleryFileStem(b);
    const aExact = aStem === reqStem ? 1 : 0;
    const bExact = bStem === reqStem ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return b.length - a.length;
  });

  return candidates[0];
}
