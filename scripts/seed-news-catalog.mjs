#!/usr/bin/env node
/**
 * Envia o catálogo canónico para /api/admin/content (Supabase).
 * Uso: npm run dev (noutro terminal) && node scripts/seed-news-catalog.mjs
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

async function loadCatalog() {
  const mod = await import(pathToFileURL(path.join(root, 'src/data/news-catalog.ts')).href);
  const i18n = await import(pathToFileURL(path.join(root, 'src/lib/news-i18n.ts')).href);
  return i18n.migrateNewsCatalog(mod.newsCatalog);
}

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function main() {
  const news = await loadCatalog();
  const res = await fetch(`${base}/api/admin/content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ news }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Falha:', data);
    process.exit(1);
  }
  console.log(`OK — ${data.count ?? news.length} notícias sincronizadas (supabase: ${data.supabase})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
