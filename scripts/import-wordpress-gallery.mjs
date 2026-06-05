#!/usr/bin/env node
/**
 * Importa imagens usadas no site WordPress (aamihe.com) para public/gallery
 * e remove ficheiros não referenciados.
 *
 * O export XML do WordPress costuma vir vazio (sem posts); por isso a fonte
 * principal é a REST API + conteúdo das páginas + referências no código.
 */
import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY_DIR = path.join(ROOT, 'public', 'gallery');
const XML_PATH = path.join(ROOT, 'aamihe.WordPress.2026-06-05.xml');
const WP_BASE = 'https://aamihe.com';
const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const WP_UPLOAD_RE =
  /https?:\/\/aamihe\.com\/wp-content\/uploads\/[^"'\s>)]+?\.(?:jpe?g|png|webp|gif)/gi;

const STATIC_PAGES = [
  '/',
  '/sobre-nos/',
  '/galeria-de-fotos/',
  '/galeria/',
  '/blog/',
  '/conferencia/',
  '/contacte-nos/',
  '/paises-membros/',
];

function stripDimensions(filename) {
  let name = filename;
  name = name.replace(/-\d+x\d+(?=\.(?:png|jpe?g|gif)\.webp$)/i, '');
  name = name.replace(/-scaled(?=\.(?:png|jpe?g|gif))/i, '');
  name = name.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '');
  return name;
}

function mediaUniqueBasename(urlOrName) {
  let name = path.basename(String(urlOrName).split('?')[0]).toLowerCase();
  name = stripDimensions(name);
  if (/\.(jpe?g|png|gif)\.webp$/i.test(name)) name = name.replace(/\.webp$/i, '');
  return name;
}

/** Chave flexível para casar ficheiros WP com nomes locais (países, .jpg.webp, etc.). */
function matchKeys(urlOrName) {
  const base = mediaUniqueBasename(urlOrName);
  const keys = new Set([base]);
  keys.add(base.replace(/\.(jpe?g|png|gif|webp)$/, ''));
  keys.add(base.replace(/-scaled(?=\.[a-z])/, ''));
  const stem = base.replace(/\.[^.]+$/, '');
  if (stem) keys.add(stem);
  return [...keys].filter(Boolean);
}

function findWpUrls(wpGroups, localRef) {
  for (const key of matchKeys(localRef)) {
    const hit = wpGroups.get(key);
    if (hit?.size) return hit;
  }
  for (const [key, urls] of wpGroups) {
    for (const mk of matchKeys(localRef)) {
      if (key.startsWith(mk) || mk.startsWith(key.replace(/\.[^.]+$/, ''))) return urls;
    }
  }
  return null;
}

function pickBestUrl(urls) {
  const list = [...urls];
  list.sort((a, b) => {
    const aDim = /-\d+x\d+\.[a-z]/i.test(a);
    const bDim = /-\d+x\d+\.[a-z]/i.test(b);
    if (aDim !== bDim) return aDim ? 1 : -1;
    const aTiny = /-\d{1,2}x\d{1,2}\./i.test(a);
    const bTiny = /-\d{1,2}x\d{1,2}\./i.test(b);
    if (aTiny !== bTiny) return aTiny ? 1 : -1;
    const aScaled = /-scaled\./i.test(a);
    const bScaled = /-scaled\./i.test(b);
    if (aScaled !== bScaled) return aScaled ? -1 : 1;
    return b.length - a.length;
  });
  return list[0];
}

function normalizeLocalRef(ref) {
  let p = ref.trim();
  if (!p.startsWith('/')) return null;
  if (p.includes('${')) return null;
  return p.replace(/^\/images\//, '/gallery/');
}

function galleryRelFromLocal(localPath) {
  const norm = normalizeLocalRef(localPath);
  if (!norm?.startsWith('/gallery/')) return null;
  return norm.replace(/^\/gallery\//, '');
}

async function parseXmlUrls() {
  const urls = new Set();
  try {
    const xml = await readFile(XML_PATH, 'utf8');
    for (const m of xml.matchAll(WP_UPLOAD_RE)) urls.add(m[0].split('?')[0]);
    for (const m of xml.matchAll(/<wp:attachment_url>([^<]+)<\/wp:attachment_url>/gi)) {
      const u = m[1].trim();
      if (u) urls.add(u.split('?')[0]);
    }
    console.log(`XML: ${urls.size} URL(s) encontrada(s)`);
  } catch {
    console.log('XML: ficheiro não encontrado ou ilegível');
  }
  return urls;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'aamihe-gallery-import/1.0' } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function collectWordPressUrls() {
  const urls = new Set();

  for (const type of ['posts', 'pages']) {
    let page = 1;
    while (true) {
      const res = await fetch(
        `${WP_BASE}/wp-json/wp/v2/${type}?per_page=100&page=${page}&status=publish`,
        { headers: { 'User-Agent': 'aamihe-gallery-import/1.0' } },
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const item of data) {
        const html = item.content?.rendered || '';
        for (const m of html.matchAll(WP_UPLOAD_RE)) urls.add(m[0].split('?')[0]);

        if (item.featured_media) {
          try {
            const media = await fetchJson(`${WP_BASE}/wp-json/wp/v2/media/${item.featured_media}`);
            if (media?.source_url && IMAGE_RE.test(media.source_url)) {
              urls.add(media.source_url.split('?')[0]);
            }
          } catch {
            /* skip */
          }
        }
      }

      const pages = Number(res.headers.get('x-wp-totalpages') || 1);
      if (page >= pages) break;
      page++;
    }
  }

  for (const pagePath of STATIC_PAGES) {
    try {
      const res = await fetch(`${WP_BASE}${pagePath}`, {
        headers: { 'User-Agent': 'aamihe-gallery-import/1.0' },
      });
      const html = await res.text();
      for (const m of html.matchAll(WP_UPLOAD_RE)) urls.add(m[0].split('?')[0]);
    } catch {
      /* skip */
    }
  }

  return urls;
}

async function collectCodebaseRefs() {
  const refs = new Set();
  const srcDir = path.join(ROOT, 'src');

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') await walk(full);
        continue;
      }
      if (!/\.(ts|tsx|json|css)$/.test(entry.name)) continue;
      const text = await readFile(full, 'utf8');
      for (const m of text.matchAll(/['"`](\/(?:gallery|images)\/[^'"`]+)['"`]/g)) {
        const norm = normalizeLocalRef(m[1]);
        if (norm) refs.add(norm);
      }
      for (const m of text.matchAll(WP_UPLOAD_RE)) refs.add(m[0].split('?')[0]);
    }
  }

  await walk(srcDir);
  return refs;
}

function groupByBasename(urls) {
  const groups = new Map();
  for (const url of urls) {
    if (url.includes('elementor/screenshots')) continue;
    const key = mediaUniqueBasename(url);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(url);
  }
  return groups;
}

async function downloadToFile(url, destAbs) {
  await mkdir(path.dirname(destAbs), { recursive: true });
  const res = await fetch(url, { headers: { 'User-Agent': 'aamihe-gallery-import/1.0' } });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destAbs, buf);
  return buf.length;
}

async function walkGalleryFiles(dir = GALLERY_DIR, prefix = '') {
  const files = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkGalleryFiles(full, rel)));
    } else if (IMAGE_RE.test(entry.name) && entry.name !== '.DS_Store') {
      files.push(rel);
    }
  }
  return files;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const skipClean = process.argv.includes('--no-clean');

  const xmlUrls = await parseXmlUrls();
  const wpUrls = await collectWordPressUrls();
  const codeRefs = await collectCodebaseRefs();

  const allWp = new Set([...xmlUrls, ...wpUrls]);
  const wpGroups = groupByBasename(allWp);

  console.log(`WordPress: ${allWp.size} URL(s) → ${wpGroups.size} imagem(ns) única(s)`);
  console.log(`Código: ${codeRefs.size} referência(s) locais`);

  /** relPath → sourceUrl */
  const toDownload = new Map();

  for (const ref of codeRefs) {
    if (ref.startsWith('http')) {
      const key = mediaUniqueBasename(ref);
      const best = pickBestUrl(wpGroups.get(key) ?? new Set([ref]));
      const rel = `gallery/${path.basename(ref)}`;
      toDownload.set(rel.replace(/^gallery\//, ''), best);
      continue;
    }

    const rel = galleryRelFromLocal(ref);
    if (!rel) continue;

    const candidates = findWpUrls(wpGroups, rel);
    if (!candidates || candidates.size === 0) {
      console.warn(`  ⚠ sem fonte WP: ${ref}`);
      continue;
    }
    toDownload.set(rel, pickBestUrl(candidates));
  }

  for (const [key, urls] of wpGroups) {
    const already = [...toDownload.keys()].some((rel) => mediaUniqueBasename(rel) === key);
    if (already) continue;
    const best = pickBestUrl(urls);
    toDownload.set(path.basename(best), best);
  }

  const keep = new Set();
  const keepBasenames = new Set();

  for (const ref of codeRefs) {
    if (!ref.startsWith('/')) continue;
    const rel = galleryRelFromLocal(ref);
    if (rel) {
      keep.add(rel.replace(/\\/g, '/'));
      for (const key of matchKeys(rel)) keepBasenames.add(key);
    }
  }

  let downloaded = 0;
  let skipped = 0;

  for (const [rel, url] of toDownload) {
    const destAbs = path.join(GALLERY_DIR, rel);
    const norm = rel.replace(/\\/g, '/');
    keep.add(norm);
    for (const key of matchKeys(norm)) keepBasenames.add(key);

    if (dryRun) {
      console.log(`  → ${rel} ← ${url}`);
      continue;
    }

    try {
      let exists = false;
      try {
        const st = await stat(destAbs);
        exists = st.size > 0;
      } catch {
        /* missing */
      }

      if (!exists) {
        const size = await downloadToFile(url, destAbs);
        console.log(`  ✓ ${rel} (${Math.round(size / 1024)} KB)`);
        downloaded++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  ✗ ${rel}: ${err.message}`);
    }
  }

  let removed = 0;
  if (!dryRun && !skipClean) {
    const existing = await walkGalleryFiles();
    for (const rel of existing) {
      const norm = rel.replace(/\\/g, '/');
      const key = mediaUniqueBasename(norm);
      const keptByPath = keep.has(norm);
      const keptByBasename = [...keepBasenames].some(
        (k) => matchKeys(norm).includes(k) || matchKeys(k).includes(mediaUniqueBasename(norm)),
      );
      if (!keptByPath && !keptByBasename) {
        await unlink(path.join(GALLERY_DIR, rel));
        console.log(`  − removido: ${norm}`);
        removed++;
      }
    }
  }

  const finalCount = dryRun ? '—' : (await walkGalleryFiles()).length;
  console.log('\nResumo:');
  console.log(`  Transferidas: ${downloaded}`);
  console.log(`  Já existiam: ${skipped}`);
  console.log(`  Removidas: ${removed}`);
  console.log(`  Total na galeria: ${finalCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
