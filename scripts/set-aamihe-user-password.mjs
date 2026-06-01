/**
 * Define a senha Supabase Auth de um utilizador AAMIHE (login do site).
 * Não grava a senha em ficheiros — passe por variável de ambiente.
 *
 * Uso (.env.local com SUPABASE_SERVICE_ROLE_KEY):
 *   AAMIHE_USER_PASSWORD='sua-senha' node scripts/set-aamihe-user-password.mjs silva.chamo@gmail.com
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
loadEnvFile(resolve(root, '.env'));

const email = process.argv[2]?.trim().toLowerCase();
const password = process.env.AAMIHE_USER_PASSWORD?.trim();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!email || !email.includes('@')) {
  console.error('Uso: AAMIHE_USER_PASSWORD=... node scripts/set-aamihe-user-password.mjs email@aamihe.com');
  process.exit(1);
}
if (!password) {
  console.error('Defina AAMIHE_USER_PASSWORD (não passe a senha como argumento — evita histórico do shell).');
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error('Erro ao listar utilizadores:', listErr.message);
  process.exit(1);
}

const user = list.users.find((u) => u.email?.toLowerCase() === email);
if (!user) {
  console.error(`Não existe utilizador Auth com email ${email}. Execute npm run migrate-users se for conta antiga.`);
  process.exit(1);
}

const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, { password });
if (updateErr) {
  console.error('Erro ao actualizar senha:', updateErr.message);
  process.exit(1);
}

console.log(`Senha Auth actualizada para ${email} (id ${user.id}). Pode entrar no site com essa senha.`);
