#!/usr/bin/env node
/**
 * Copia ficheiros Storage cloud -> Hetzner e actualiza URLs na BD.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const root = resolve(import.meta.dirname, '..');
loadEnvFile(resolve(root, '.env.local'));

const cloudUrl = process.env.SUPABASE_CLOUD_URL;
const cloudKey = process.env.SUPABASE_CLOUD_SERVICE_ROLE_KEY;
const hetznerUrl = process.env.SUPABASE_HETZNER_URL || 'https://supabase.aamihe.com';
const hetznerKey =
  process.env.SUPABASE_HETZNER_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!cloudUrl?.includes('supabase.co') || !cloudKey || !hetznerKey) {
  console.error('Defina SUPABASE_CLOUD_URL e SUPABASE_CLOUD_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const cloud = createClient(cloudUrl, cloudKey, { auth: { persistSession: false } });
const hetzner = createClient(hetznerUrl, hetznerKey, { auth: { persistSession: false } });

const BUCKETS = ['aamihe-media', 'avatars'];
const CLOUD_HOST = new URL(cloudUrl).host;
const HETZNER_PUBLIC = `${hetznerUrl.replace(/\/$/, '')}/storage/v1/object/public`;

async function listAllPaths(bucket, prefix = '') {
  const out = [];
  const { data, error } = await cloud.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
  for (const item of data || []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata && typeof item.metadata.size === 'number') {
      out.push(path);
    } else if (!item.metadata || item.id === null) {
      const nested = await listAllPaths(bucket, path);
      out.push(...nested);
    } else if (item.metadata) {
      out.push(path);
    }
  }
  return out;
}

async function copyObject(bucket, path) {
  const { data: blob, error: dlErr } = await cloud.storage.from(bucket).download(path);
  if (dlErr) throw new Error(`download ${bucket}/${path}: ${dlErr.message}`);

  const buf = Buffer.from(await blob.arrayBuffer());
  const contentType = blob.type || 'application/octet-stream';

  const { error: upErr } = await hetzner.storage.from(bucket).upload(path, buf, {
    contentType,
    upsert: true,
  });
  if (upErr) throw new Error(`upload ${bucket}/${path}: ${upErr.message}`);

  const { data } = hetzner.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function hetznerPublicUrl(bucket, path) {
  const { data } = hetzner.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function ensureBucket(bucket, isPublic = true) {
  const { data: existing } = await hetzner.storage.getBucket(bucket);
  if (existing) return;
  const { error } = await hetzner.storage.createBucket(bucket, { public: isPublic });
  if (error) throw new Error(`createBucket ${bucket}: ${error.message}`);
}

async function migrateBucket(bucket) {
  console.log(`\n==> Bucket ${bucket}`);
  await ensureBucket(bucket);
  const paths = await listAllPaths(bucket);
  console.log(`  ${paths.length} ficheiros`);
  let ok = 0;
  for (const path of paths) {
    try {
      await copyObject(bucket, path);
      ok++;
      if (ok % 25 === 0) console.log(`  ... ${ok}/${paths.length}`);
    } catch (e) {
      console.error(`  ERRO ${path}:`, e.message);
    }
  }
  console.log(`  Copiados: ${ok}/${paths.length}`);
}

function replaceCloudUrls(value) {
  if (typeof value === 'string' && value.includes(CLOUD_HOST)) {
    return value
      .replaceAll(`https://${CLOUD_HOST}`, hetznerUrl.replace(/\/$/, ''))
      .replaceAll(`http://${CLOUD_HOST}`, hetznerUrl.replace(/\/$/, ''));
  }
  return value;
}

async function updateDatabaseUrls() {
  console.log('\n==> Actualizar URLs na BD');

  const { data: media, error: mErr } = await hetzner.from('site_media').select('id, url, storage_path');
  if (mErr) throw mErr;

  let mediaUp = 0;
  for (const row of media || []) {
    let url = row.url;
    let storage_path = row.storage_path;
    if (url?.includes(CLOUD_HOST)) {
      url = replaceCloudUrls(url);
      if (storage_path) {
        const bucket = url.includes('/aamihe-media/') ? 'aamihe-media' : 'avatars';
        try {
          url = hetznerPublicUrl(bucket, storage_path);
        } catch {
          /* keep replaced host */
        }
      }
    }
    if (url !== row.url || storage_path !== row.storage_path) {
      const { error } = await hetzner.from('site_media').update({ url }).eq('id', row.id);
      if (!error) mediaUp++;
    }
  }
  console.log(`  site_media: ${mediaUp} URLs actualizadas`);

  const { data: profiles, error: pErr } = await hetzner
    .from('aamihe_user_profiles')
    .select('id, avatar_url');
  if (pErr) throw pErr;

  let profUp = 0;
  for (const row of profiles || []) {
    if (!row.avatar_url?.includes(CLOUD_HOST)) continue;
    const avatar_url = replaceCloudUrls(row.avatar_url);
    const { error } = await hetzner
      .from('aamihe_user_profiles')
      .update({ avatar_url })
      .eq('id', row.id);
    if (!error) profUp++;
  }
  console.log(`  perfis: ${profUp} avatares actualizados`);

  const { data: contentRows, error: cErr } = await hetzner
    .from('site_content')
    .select('site_slug, news, documents');
  if (cErr) throw cErr;

  for (const row of contentRows || []) {
    const news = JSON.parse(JSON.stringify(row.news || []));
    const documents = JSON.parse(JSON.stringify(row.documents || []));
    const newsStr = JSON.stringify(news);
    const docStr = JSON.stringify(documents);
    if (!newsStr.includes(CLOUD_HOST) && !docStr.includes(CLOUD_HOST)) continue;

    const walk = (obj) => {
      if (typeof obj === 'string') return replaceCloudUrls(obj);
      if (Array.isArray(obj)) return obj.map(walk);
      if (obj && typeof obj === 'object') {
        const o = {};
        for (const [k, v] of Object.entries(obj)) o[k] = walk(v);
        return o;
      }
      return obj;
    };

    const { error } = await hetzner
      .from('site_content')
      .update({ news: walk(news), documents: walk(documents) })
      .eq('site_slug', row.site_slug);
    if (error) console.error('  site_content:', error.message);
    else console.log(`  site_content (${row.site_slug}): URLs actualizadas`);
  }
}

async function main() {
  console.log('Cloud:', cloudUrl);
  console.log('Hetzner:', hetznerUrl);
  for (const bucket of BUCKETS) {
    await migrateBucket(bucket);
  }
  await updateDatabaseUrls();
  console.log('\nStorage migrado.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
