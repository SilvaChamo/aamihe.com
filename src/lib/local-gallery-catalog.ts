import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { findBestGalleryUrl } from '@/lib/gallery-match';
import { mediaUniqueBasename } from '@/lib/media-catalog-key';
import { isLocalGalleryMode, supabaseOrPathToGalleryUrl } from '@/lib/local-gallery-mode';
import type { SiteMediaRecord } from '@/lib/site-media';

export { isLocalGalleryMode, supabaseOrPathToGalleryUrl };

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const GALLERY_DIR = 'gallery';
const GALLERY_FALLBACK = '/gallery/Logo-Small.png.webp';

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function titleFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stableId(relUrl: string): string {
  return `gallery_${createHash('sha1').update(relUrl).digest('hex').slice(0, 12)}`;
}

function subcategoryFor(relPath: string, filename: string): string {
  if (relPath.includes('/paises/')) return 'Países membros';
  if (relPath.includes('/flags/')) return 'Site';
  if (filename.startsWith('news-')) return 'Notícias';
  return 'Galeria';
}

/**
 * Todas as imagens em public/gallery (raiz + subpastas), uma entrada por ficheiro.
 */
export async function collectGalleryImages(): Promise<SiteMediaRecord[]> {
  const galleryRoot = path.join(process.cwd(), 'public', GALLERY_DIR);
  const now = new Date().toISOString();
  const records: SiteMediaRecord[] = [];

  async function walk(dir: string, prefix: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.trash') continue;
        await walk(full, rel);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;

      const url = `/${GALLERY_DIR}/${rel.replace(/\\/g, '/')}`;
      let size = 0;
      try {
        size = (await stat(full)).size;
      } catch {
        /* skip */
      }

      records.push({
        id: stableId(url),
        site_slug: 'aamihe',
        title: titleFromFilename(entry.name),
        url,
        category: 'imagens',
        subcategory: subcategoryFor(rel, entry.name),
        mime_type: mimeFromName(entry.name),
        size: size || undefined,
        source: 'legacy',
        published: true,
        catalog_key: url.toLowerCase(),
        created_at: now,
        updated_at: now,
      });
    }
  }

  await walk(galleryRoot, '');
  return records.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
}

/** Resolve caminho de notícia/site para ficheiro em public/gallery. */
export async function resolveToGalleryUrl(imagePath: string): Promise<string> {
  const trimmed = imagePath?.trim();
  if (!trimmed) return GALLERY_FALLBACK;

  const catalog = await collectGalleryImages();
  const urls = catalog.map((item) => item.url);
  const normalized = trimmed.startsWith('/images/')
    ? trimmed.replace(/^\/images\//, '/gallery/')
    : trimmed.startsWith('/Imagens/')
      ? trimmed.replace(/^\/Imagens\//, '/gallery/')
      : trimmed;

  const fuzzy = findBestGalleryUrl(normalized, urls);
  if (fuzzy) return fuzzy;

  const basename = mediaUniqueBasename(trimmed);
  const byBasename = catalog.filter((item) => mediaUniqueBasename(item.url) === basename);
  if (byBasename.length > 0) {
    byBasename.sort((a, b) => (b.size || 0) - (a.size || 0));
    return byBasename[0].url;
  }

  const direct = supabaseOrPathToGalleryUrl(trimmed);
  if (direct) {
    const hit = findBestGalleryUrl(direct, urls);
    if (hit) return hit;
  }

  return GALLERY_FALLBACK;
}
