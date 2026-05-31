#!/usr/bin/env node
/**
 * Importa src/data/noticias/catalog.json para Supabase (site_content).
 * Uso: npm run import-noticias
 * Requer .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_SLUG = 'aamihe';

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    console.error('Ficheiro .env.local não encontrado.');
    process.exit(1);
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function mergeLocaleTranslation(base, extra) {
  if (!base && !extra) return undefined;
  return {
    title: base?.title ?? extra?.title ?? '',
    content: extra?.content ?? base?.content,
    summary: extra?.summary ?? base?.summary,
    category: base?.category ?? extra?.category,
  };
}

function loadCatalog() {
  const catalogPath = path.join(ROOT, 'src/data/noticias/catalog.json');
  const extrasPath = path.join(ROOT, 'src/data/noticias/content-translations.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const extrasById = JSON.parse(readFileSync(extrasPath, 'utf8'));

  if (!Array.isArray(catalog) || catalog.length === 0) {
    throw new Error('Catálogo vazio ou inválido');
  }

  return catalog.map((item) => {
    const extras = extrasById[String(item.id)] ?? {};
    const ptExtra = extras.pt;
    const enMerged = mergeLocaleTranslation(item.translations?.en, extras.en);
    const frMerged = mergeLocaleTranslation(item.translations?.fr, extras.fr);
    const translations = {};
    if (enMerged?.title) translations.en = enMerged;
    if (frMerged?.title) translations.fr = frMerged;

    return {
      ...item,
      content: ptExtra?.content?.trim() ? ptExtra.content : item.content,
      summary: ptExtra?.summary?.trim() ? ptExtra.summary : item.summary,
      translations: Object.keys(translations).length > 0 ? translations : item.translations,
    };
  });
}

function loadCategories() {
  return [
    { name: 'Institucional', slug: 'institucional', description: '', etiqueta: '' },
    { name: 'Educação', slug: 'educacao', description: '', etiqueta: '' },
    { name: 'Desenvolvimento', slug: 'desenvolvimento', description: '', etiqueta: '' },
    { name: 'Eventos', slug: 'eventos', description: '', etiqueta: '' },
  ];
}

async function main() {
  loadEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
    process.exit(1);
  }

  const news = loadCatalog();
  const categories = loadCategories();
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing } = await admin
    .from('site_content')
    .select('documents')
    .eq('site_slug', SITE_SLUG)
    .maybeSingle();

  const documents = existing?.documents ?? [];

  const { error } = await admin.from('site_content').upsert(
    {
      site_slug: SITE_SLUG,
      news,
      categories,
      documents,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_slug' },
  );

  if (error) {
    console.error('Erro Supabase:', error.message);
    process.exit(1);
  }

  console.log(`Importadas ${news.length} notícias para Supabase (site_content / ${SITE_SLUG}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
