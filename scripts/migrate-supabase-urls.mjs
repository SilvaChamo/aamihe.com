#!/usr/bin/env node
/**
 * Reescreve URLs Supabase antigos (aamihe.com, supabase.co) para NEXT_PUBLIC_SUPABASE_URL.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(path.join(root, name), 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m && !process.env[m[1].trim()]) {
          process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* skip */
    }
  }
}

function rewrite(url, origin) {
  if (!url?.trim()) return url;
  const match = url.match(/(\/storage\/v1\/object\/public\/[^?#]+)/i);
  if (!match) return url;
  return `${origin.replace(/\/$/, '')}${match[1]}`;
}

async function main() {
  loadEnv();
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!origin || !key) throw new Error('Supabase não configurado.');

  const sb = createClient(origin, key);
  let updatedProfiles = 0;
  let updatedMedia = 0;

  const { data: profiles } = await sb.from('aamihe_user_profiles').select('id, avatar_url');
  for (const row of profiles || []) {
    const next = rewrite(row.avatar_url, origin);
    if (next && next !== row.avatar_url) {
      await sb.from('aamihe_user_profiles').update({ avatar_url: next }).eq('id', row.id);
      updatedProfiles += 1;
    }
  }

  const { data: media } = await sb.from('site_media').select('id, url');
  for (const row of media || []) {
    const next = rewrite(row.url, origin);
    if (next && next !== row.url) {
      await sb.from('site_media').update({ url: next }).eq('id', row.id);
      updatedMedia += 1;
    }
  }

  console.log(
    JSON.stringify({ origin, updatedProfiles, updatedMedia }, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
