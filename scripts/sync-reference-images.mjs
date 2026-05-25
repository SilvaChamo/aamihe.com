#!/usr/bin/env node
/**
 * Copia imagens em falta de ../aamihe/site para public/gallery e public/images.
 * Uso: node scripts/sync-reference-images.mjs
 */
import { access, copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const referenceRoot = path.join(projectRoot, '../aamihe/site');
const publicRoot = path.join(projectRoot, 'public');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const TARGET_DIRS = ['gallery', 'images/paises', 'images'];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, files);
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function main() {
  if (!(await exists(referenceRoot))) {
    console.error('Pasta de referência não encontrada:', referenceRoot);
    process.exit(1);
  }

  const sources = await walk(referenceRoot);
  let copied = 0;

  for (const src of sources) {
    const name = path.basename(src);
    if (/pt_PT|fr_FR|en_GB|Logo-Small|favicon/i.test(name)) continue;

    const targets = [
      path.join(publicRoot, 'gallery', name),
      path.join(publicRoot, 'images', 'paises', name),
      path.join(publicRoot, 'images', name),
    ];

    for (const dest of targets) {
      if (await exists(dest)) continue;
      if (dest.includes('/paises/') && !src.includes('paises') && !name.includes('300x')) continue;
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(src, dest);
      copied += 1;
      console.log('copied', name, '->', path.relative(publicRoot, dest));
      break;
    }
  }

  console.log(`Concluído: ${copied} ficheiro(s) copiado(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
