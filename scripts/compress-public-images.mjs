#!/usr/bin/env node
/**
 * Comprime imagens em public/ (galeria, uploads) para ≤ 1 MB.
 * Uso: node scripts/compress-public-images.mjs
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MAX_BYTES = 1024 * 1024;
const MAX_DIM = 1920;
const DIRS = ['public/gallery', 'public/uploads/imagens', 'public/images', 'public/Imagens'];

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff']);

async function walk(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(full)));
      } else if (EXT.has(path.extname(entry.name).toLowerCase())) {
        files.push(full);
      }
    }
  } catch {
    /* pasta inexistente */
  }
  return files;
}

async function main() {
  const sharp = (await import('sharp')).default;
  let changed = 0;
  let skipped = 0;

  for (const rel of DIRS) {
    const abs = path.join(ROOT, rel);
    for (const filePath of await walk(abs)) {
      const info = await stat(filePath);
      if (info.size <= MAX_BYTES) {
        skipped += 1;
        continue;
      }

      const before = info.size;
      let pipeline = sharp(filePath).rotate();
      const meta = await pipeline.metadata();
      if ((meta.width ?? 0) > MAX_DIM || (meta.height ?? 0) > MAX_DIM) {
        pipeline = pipeline.resize({
          width: MAX_DIM,
          height: MAX_DIM,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      let quality = 82;
      let buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      while (buffer.length > MAX_BYTES && quality > 42) {
        quality -= 10;
        buffer = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
      }

      const outPath = filePath.replace(/\.[^.]+$/i, '.jpg');
      await writeFile(outPath, buffer);
      if (outPath !== filePath) {
        const { unlink } = await import('node:fs/promises');
        await unlink(filePath).catch(() => {});
      }

      changed += 1;
      console.log(
        `${path.relative(ROOT, outPath)}: ${(before / 1024).toFixed(0)} KB → ${(buffer.length / 1024).toFixed(0)} KB`,
      );
    }
  }

  console.log(`Concluído: ${changed} comprimidas, ${skipped} já ≤ 1 MB.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
