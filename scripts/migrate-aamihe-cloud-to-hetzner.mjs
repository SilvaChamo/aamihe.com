#!/usr/bin/env node
/**
 * Migra dados AAMIHE do Supabase cloud para Supabase Hetzner.
 *
 * .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  (origem cloud)
 *   SUPABASE_HETZNER_URL + SUPABASE_HETZNER_SERVICE_ROLE_KEY  (destino)
 *
 * Uso: npm run supabase-hetzner:migrate
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

const sourceUrl =
  process.env.SUPABASE_CLOUD_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const sourceKey =
  process.env.SUPABASE_CLOUD_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetUrl =
  process.env.SUPABASE_HETZNER_URL || 'https://supabase.visualdesignmoz.com';
const targetKey = process.env.SUPABASE_HETZNER_SERVICE_ROLE_KEY;

if (!sourceUrl || !sourceKey || !targetKey) {
  console.error(
    'Em .env.local defina:\n' +
      '  SUPABASE_CLOUD_URL + SUPABASE_CLOUD_SERVICE_ROLE_KEY (origem)\n' +
      '  SUPABASE_HETZNER_SERVICE_ROLE_KEY (+ SUPABASE_HETZNER_URL opcional)\n' +
      'Ou temporariamente NEXT_PUBLIC_SUPABASE_URL (cloud) + SUPABASE_HETZNER_*',
  );
  process.exit(1);
}

if (!sourceUrl.includes('supabase.co') && !process.env.SUPABASE_CLOUD_URL) {
  console.warn(
    'Aviso: origem não parece Supabase cloud. Use SUPABASE_CLOUD_URL se já alterou NEXT_PUBLIC para Hetzner.',
  );
}

const source = createClient(sourceUrl, sourceKey, { auth: { persistSession: false } });
const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });

async function migrateTable(name, conflict) {
  const { data, error } = await source.from(name).select('*');
  if (error) throw new Error(`${name} leitura: ${error.message}`);
  if (!data?.length) {
    console.log(`  ${name}: 0 linhas (ignorado)`);
    return;
  }
  const { error: insErr } = await target.from(name).upsert(data, { onConflict: conflict });
  if (insErr) throw new Error(`${name} escrita: ${insErr.message}`);
  console.log(`  ${name}: ${data.length} linhas OK`);
}

async function targetUserByEmail(email) {
  const { data, error } = await target.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

async function migrateAuthAndProfiles() {
  const { data: profiles, error: profErr } = await source
    .from('aamihe_user_profiles')
    .select('*');
  if (profErr) throw new Error(`profiles leitura: ${profErr.message}`);
  if (!profiles?.length) {
    console.log('  perfis: 0 (ignorado)');
    return;
  }

  const { data: sourceUsers, error: listErr } = await source.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) throw new Error(`auth origem: ${listErr.message}`);

  const userById = new Map((sourceUsers?.users || []).map((u) => [u.id, u]));

  for (const profile of profiles) {
    const srcUser = userById.get(profile.id);
    const email = profile.email || srcUser?.email;
    if (!email) {
      console.error(`  ${profile.username}: sem email, ignorado`);
      continue;
    }

    let tgtUser = await targetUserByEmail(email);
    if (!tgtUser) {
      const tempPassword = `Migrate-${Date.now().toString(36)}!Aa1`;
      const { data: created, error: createErr } = await target.auth.admin.createUser({
        id: profile.id,
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: srcUser?.user_metadata ?? {},
      });
      if (createErr) {
        console.error(`  auth ${email}: ${createErr.message}`);
        continue;
      }
      tgtUser = created.user;
      console.log(`  auth ${email}: criado (mesmo UUID)`);
    } else {
      console.log(`  auth ${email}: já existe`);
    }

    const row = { ...profile, id: tgtUser.id, email };
    const { error: upsErr } = await target
      .from('aamihe_user_profiles')
      .upsert(row, { onConflict: 'id' });
    if (upsErr) {
      console.error(`  perfil ${email}: ${upsErr.message}`);
    } else {
      console.log(`  perfil ${email}: OK`);
    }
  }
}

async function main() {
  console.log('Origem:', sourceUrl);
  console.log('Destino:', targetUrl);
  console.log('\nConteúdo...');
  await migrateTable('site_content', 'site_slug');
  await migrateTable('site_media', 'id');
  console.log('\nAuth + perfis AAMIHE...');
  await migrateAuthAndProfiles();
  console.log('\nConcluído.');
  console.log('Senhas: defina de novo no Hetzner (Repor senha) ou actualize manualmente no Studio.');
  console.log('Storage: URLs antigas cloud continuam até copiar ficheiros para bucket aamihe-media.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
