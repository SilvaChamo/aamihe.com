/** Tabs alinhados com a galeria em aamihe.com/galeria-de-fotos/ */
export type GalleryPhotoTab =
  | 'all'
  | 'graduacao'
  | 'fotos-direccao'
  | 'arquivo-1'
  | 'arquivo-2'
  | 'eventos';

export function classifyGalleryPhotoTab(url: string, subcategory = ''): GalleryPhotoTab | null {
  const name = url.split('/').pop()?.toLowerCase() ?? '';
  const sub = subcategory.toLowerCase();

  if (
    /vice-president|secretary|consultants|compressed-scaled|71149512|rosemary|mutombo|gnalega|gonway|mageto|lumumba|jamisse|tukumbi|tiago|rene|yar|peter/.test(
      name,
    )
  ) {
    return 'fotos-direccao';
  }

  if (/^img[_-]/i.test(name)) {
    return 'graduacao';
  }

  if (/^image-\d+/i.test(name)) {
    const num = Number.parseInt(name.match(/image-(\d+)/i)?.[1] ?? '99', 10);
    return num <= 5 ? 'arquivo-1' : 'arquivo-2';
  }

  if (
    sub === 'notícias' ||
    sub === 'noticias' ||
    /^news-/i.test(name) ||
    /bgnoticias|conference|poster|envento|event/i.test(name)
  ) {
    return 'eventos';
  }

  return null;
}

export function matchesGalleryPhotoTab(
  url: string,
  subcategory: string,
  tab: GalleryPhotoTab,
): boolean {
  if (tab === 'all') return true;
  return classifyGalleryPhotoTab(url, subcategory) === tab;
}
