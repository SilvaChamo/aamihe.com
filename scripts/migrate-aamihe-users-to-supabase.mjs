/**
 * Migra utilizadores de aamihe_users.json para Supabase Auth + aamihe_user_profiles.
 *
 * Pré-requisitos:
 * 1. Executar scripts/supabase-aamihe-profiles.sql no Supabase
 * 2. Definir NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local
 *
 * Uso: node scripts/migrate-aamihe-users-to-supabase.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, 'utf8');
  for (const line of raw.split('\n')) {
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
loadEnvFile(resolve(root, '.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const usersPath = resolve(root, 'scripts/backup/aamihe_users.json');
const legacyPath = resolve(root, 'aamihe_users.json');
const sourcePath = existsSync(usersPath) ? usersPath : legacyPath;

if (!existsSync(sourcePath)) {
  console.error('Ficheiro aamihe_users.json não encontrado.');
  process.exit(1);
}

const db = JSON.parse(readFileSync(sourcePath, 'utf8'));
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const TEMP_PASSWORD = process.env.MIGRATE_TEMP_PASSWORD || `Aamihe-${Date.now().toString(36)}!`;

for (const user of db.users || []) {
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) continue;

  console.log(`Migrando ${email}…`);

  const { data: existingProfile } = await admin
    .from('aamihe_user_profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (existingProfile) {
    console.log('  → perfil já existe, ignorado.');
    continue;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      username: user.username,
      site: 'aamihe',
      migrated: true,
    },
  });

  if (createError || !created.user) {
    console.error('  → erro auth:', createError?.message);
    continue;
  }

  const { error: profileError } = await admin.from('aamihe_user_profiles').insert({
    id: created.user.id,
    username: user.username,
    email,
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    alcunha: user.alcunha || '',
    display_name_type: user.displayNameType || 'full_name',
    role: user.role || 'Subscritor',
    bio: user.bio || '',
    website: user.website || '',
    avatar_url: user.avatar_url || '',
    telefone: user.telefone || '',
    profissao: user.profissao || '',
    cargo: user.cargo || '',
  });

  if (profileError) {
    console.error('  → erro perfil:', profileError.message);
    await admin.auth.admin.deleteUser(created.user.id);
    continue;
  }

  console.log('  → OK (peça reposição de senha ou use Google se o email coincidir).');
}

console.log('\nConcluído. Utilizadores migrados devem usar "Repor senha" ou Google OAuth.');
