#!/usr/bin/env node
/**
 * Grava configuração das páginas blog/contactos no Supabase (site_content / aamihe_settings).
 * Uso: node scripts/seed-page-config.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const SETTINGS_SLUG = 'aamihe_settings';

const publicPages = {
  blog: {
    postsPerPage: 3,
    gridColumns: 3,
    bannerTitle: 'BLOG',
    bannerImage: '/Imagens/BgNoticias.jpeg',
    scrollToTopOnPaginate: true,
    scrollTargetOnPaginate: 'banner',
  },
  contact: {
    bannerTitle: 'CONTACTE-NOS',
    bannerImage: '/Imagens/BgNoticias.jpeg',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=Pestana%20Rovuma%20Hotel,%20Maputo&t=&z=15&ie=UTF8&iwloc=&output=embed',
    contactEmail: 'geral@aamihe.com',
    contactPhone: '+258 84 308 9820',
    address: 'Rua da Sé nº 114, Pestana Rovuma Hotel',
  },
};

async function loadEnv() {
  const envPath = path.join(root, '.env.local');
  const raw = await readFile(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function main() {
  const env = await loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
    process.exit(1);
  }

  const admin = createClient(url, key);
  const { data: row } = await admin
    .from('site_content')
    .select('news')
    .eq('site_slug', SETTINGS_SLUG)
    .maybeSingle();

  const existing = row?.news && typeof row.news === 'object' && !Array.isArray(row.news) ? row.news : {};
  const merged = {
    ...existing,
    publicPages,
    contactEmail: publicPages.contact.contactEmail,
    contactPhone: publicPages.contact.contactPhone,
    address: publicPages.contact.address,
  };

  const { error } = await admin.from('site_content').upsert(
    {
      site_slug: SETTINGS_SLUG,
      news: merged,
      categories: [],
      documents: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_slug' },
  );

  if (error) {
    console.error('Supabase:', error.message);
    process.exit(1);
  }

  console.log('Configuração publicPages gravada em Supabase (aamihe_settings).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
