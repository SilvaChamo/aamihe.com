import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { SiteMediaRecord } from '@/lib/site-media';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP_PATTERN = /(?:^|\/)(pt_PT|fr_FR|en_GB)\.png$|Logo-Small|cropped-Logo|favicon/i;

const WP_GALLERY_CATEGORIES: Record<string, string> = {
  '0': 'Graduação',
  '1': 'Fotos direcção',
  '2': 'Arquivo – 1',
  '3': 'Arquivo – 2',
  '4': 'Eventos',
};

type CollectedImage = {
  url: string;
  title: string;
  subcategory: string;
  mime_type: string;
  dedupeKey: string;
};

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function basenameKey(value: string): string {
  const name = value.split('/').pop() || value;
  return name.replace(/-\d+x\d+/gi, '').toLowerCase();
}

function titleFromPath(url: string): string {
  const name = url.split('/').pop() || url;
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wpThumbToFull(url: string): string {
  return url.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '');
}

async function walkPublicImages(relativeDir: string): Promise<CollectedImage[]> {
  const absoluteDir = path.join(process.cwd(), 'public', relativeDir);
  const results: CollectedImage[] = [];

  async function walk(currentDir: string, basePath: string) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext) || SKIP_PATTERN.test(relPath)) {
        continue;
      }

      const url = `/${relPath.replace(/\\/g, '/')}`;
      let subcategory = 'Site';

      if (relPath.startsWith('gallery/')) {
        subcategory = entry.name.startsWith('news-') ? 'Notícias' : 'Galeria';
      } else if (relPath.startsWith('uploads/imagens/')) {
        subcategory = 'Notícias';
      }
      else if (relPath.startsWith('images/paises/')) subcategory = 'Países membros';
      else if (relPath.startsWith('images/')) subcategory = 'Site';
      else if (relPath.startsWith('Imagens/')) subcategory = 'Site';
      else if (relPath.startsWith('Blog_files/')) subcategory = 'Blog';

      results.push({
        url,
        title: titleFromPath(url),
        subcategory,
        mime_type: mimeFromName(entry.name),
        dedupeKey: basenameKey(entry.name),
      });
    }
  }

  await walk(absoluteDir, relativeDir);
  return results;
}

async function parseWordPressGalleryHtml(): Promise<CollectedImage[]> {
  const htmlPath = path.join(process.cwd(), 'public', 'Galeria_de_fotos.htm');

  try {
    const html = await readFile(htmlPath, 'utf8');
    const matches = [
      ...html.matchAll(
        /data-e-gallery-tags="(\d+)"[\s\S]*?data-thumbnail="([^"]+)"[\s\S]*?elementor-gallery-item__title[^>]*>\s*([^<]+)/g
      ),
    ];

    return matches.map((match) => {
      const tag = match[1];
      const thumbUrl = match[2];
      const title = match[3].trim();
      const url = wpThumbToFull(thumbUrl);

      return {
        url,
        title,
        subcategory: WP_GALLERY_CATEGORIES[tag] || 'Galeria',
        mime_type: mimeFromName(url),
        dedupeKey: basenameKey(url),
      };
    });
  } catch {
    return [];
  }
}

export async function collectAllSiteImages(): Promise<SiteMediaRecord[]> {
  const now = new Date().toISOString();
  const map = new Map<string, SiteMediaRecord>();
  const seenBasenames = new Set<string>();

  const localImages = await walkPublicImages('');
  const wpImages = await parseWordPressGalleryHtml();

  localImages.sort((a, b) => {
    const rank = (url: string) =>
      url.startsWith('/gallery/') ? 0 : url.startsWith('/images/') ? 1 : url.startsWith('/Imagens/') ? 2 : 3;
    return rank(a.url) - rank(b.url) || a.url.localeCompare(b.url);
  });

  for (const image of localImages) {
    if (seenBasenames.has(image.dedupeKey)) continue;
    seenBasenames.add(image.dedupeKey);
    map.set(image.url, {
      id: `site_${image.dedupeKey}`,
      site_slug: 'aamihe',
      title: image.title,
      url: image.url,
      category: 'imagens',
      subcategory: image.subcategory,
      mime_type: image.mime_type,
      source: 'legacy',
      published: true,
      created_at: now,
      updated_at: now,
    });
  }

  for (const image of wpImages) {
    if (seenBasenames.has(image.dedupeKey) && !image.url.startsWith('http')) {
      continue;
    }

    // Prefer local copy when basename already exists locally
    if (seenBasenames.has(image.dedupeKey)) {
      continue;
    }

    map.set(image.url, {
      id: `wp_${image.dedupeKey}`,
      site_slug: 'aamihe',
      title: image.title,
      url: image.url,
      category: 'imagens',
      subcategory: image.subcategory,
      mime_type: image.mime_type,
      source: 'legacy',
      published: true,
      created_at: now,
      updated_at: now,
    });
    seenBasenames.add(image.dedupeKey);
  }

  return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'pt'));
}
