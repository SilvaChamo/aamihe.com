#!/usr/bin/env node
/**
 * Envia todas as imagens do site para Supabase Storage + site_media.
 * Uso: node scripts/upload-all-to-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP = /(?:^|\/)(pt_PT|fr_FR|en_GB)\.png$|Logo-Small|cropped-Logo|favicon/i;
const BUCKET = 'aamihe-media';

function loadEnv() {
  const envPath = path.join(projectRoot, '.env.local');
  return readFile(envPath, 'utf8').then((raw) => {
    const env = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  });
}

function mimeFromExt(ext) {
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function catalogKey(filename) {
  return filename
    .toLowerCase()
    .replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '')
    .replace(/^news-\d+-[a-f0-9]+/i, 'news-upload')
    .replace(/^\d+-[a-f0-9]+/i, 'file-upload');
}

function sanitizeStoragePath(relPath) {
  return relPath
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w./-]+/g, '-')
    .replace(/-+/g, '-');
}

function stableId(relativePath) {
  const hash = createHash('sha1').update(relativePath).digest('hex').slice(0, 12);
  return `site_${hash}`;
}

function titleFromName(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subcategoryFor(relPath, filename) {
  if (relPath.startsWith('gallery/')) {
    return filename.startsWith('news-') ? 'Notícias' : 'Galeria';
  }
  if (relPath.startsWith('uploads/imagens/')) return 'Notícias';
  if (relPath.startsWith('images/paises/')) return 'Países membros';
  if (relPath.startsWith('images/')) return 'Site';
  if (relPath.startsWith('Blog_files/')) return 'Blog';
  return 'Galeria';
}

async function walkImages(rootDir, prefix = '') {
  const results = [];
  let entries;
  try {
    entries = await readdir(rootDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkImages(full, rel)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext) || SKIP.test(rel)) continue;
    results.push({ full, rel, filename: entry.name, ext });
  }
  return results;
}

async function main() {
  const env = await loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const publicRoot = path.join(projectRoot, 'public');
  const referenceRoot = path.join(projectRoot, '../aamihe/site');

  const publicFiles = (await walkImages(publicRoot)).map((f) => ({ ...f, fromReference: false }));
  const refFiles = (await walkImages(referenceRoot)).map((f) => ({
    ...f,
    rel: `ref/${f.rel}`,
    fromReference: true,
  }));

  const seenStorage = new Set();
  const files = [];
  for (const file of [...publicFiles, ...refFiles]) {
    const storageRel = sanitizeStoragePath(
      file.fromReference
        ? `legacy/ref/${file.rel.replace(/^ref\//, '')}`
        : `legacy/${file.rel}`
    );
    if (seenStorage.has(storageRel)) continue;
    seenStorage.add(storageRel);
    files.push({ ...file, storageRel });
  }

  console.log(`A enviar ${files.length} imagem(ns) para Supabase (${publicFiles.length} public + ${refFiles.length} referência)...`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const seenIds = new Set();

  for (const file of files) {
    const storageRel = file.storageRel;
    const id = stableId(storageRel);
    if (seenIds.has(id)) {
      skipped += 1;
      continue;
    }
    seenIds.add(id);

    try {
      const buffer = await readFile(file.full);
      const mimeType = mimeFromExt(file.ext);
      const subcategory = subcategoryFor(file.rel, file.filename);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storageRel, buffer, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error('Storage:', file.rel, uploadError.message);
        failed += 1;
        continue;
      }

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storageRel);
      const now = new Date().toISOString();

      const { error: rowError } = await supabase.from('site_media').upsert(
        {
          id,
          site_slug: 'aamihe',
          title: titleFromName(file.filename),
          url: publicData.publicUrl,
          category: 'imagens',
          subcategory,
          mime_type: mimeType,
          size: buffer.length,
          source: 'upload',
          source_id: null,
          published: true,
          catalog_key: catalogKey(file.filename),
          storage_path: storageRel,
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      );

      if (rowError) {
        console.error('DB:', file.rel, rowError.message);
        failed += 1;
        continue;
      }

      uploaded += 1;
      if (uploaded % 10 === 0) console.log(`  ${uploaded}/${files.length}...`);
    } catch (err) {
      console.error('Erro:', file.rel, err.message);
      failed += 1;
    }
  }

  console.log('\nConcluído.');
  console.log(`  Enviadas: ${uploaded}`);
  console.log(`  Ignoradas (duplicado): ${skipped}`);
  console.log(`  Falhas: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
