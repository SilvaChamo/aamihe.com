/**
 * Teste de envio SMTP (mesmo caminho que DirectAdmin / Exim no Hetzner).
 * Uso: node scripts/test-email.mjs destino@exemplo.com
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import nodemailer from 'nodemailer';

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

const to = process.argv[2]?.trim();
const from = process.env.SITE_EMAIL_FROM?.trim() || 'AAMIHE <noreply@aamihe.com>';
const transportMode = process.env.SMTP_TRANSPORT?.trim().toLowerCase();

function looksLikePlaceholder(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return (
    (v.startsWith('<') && v.endsWith('>')) ||
    /senha_da_conta|palavra-passe|password|CHAVE|example|your_|sua_senha/i.test(v)
  );
}

if (!to) {
  console.error('Uso: node scripts/test-email.mjs destino@exemplo.com');
  console.error('');
  console.error('Testar noreply:');
  console.error("  SITE_EMAIL_FROM='AAMIHE <noreply@aamihe.com>' node scripts/test-email.mjs seu@email.com");
  console.error('Testar geral:');
  console.error("  SITE_EMAIL_FROM='AAMIHE <geral@aamihe.com>' node scripts/test-email.mjs seu@email.com");
  process.exit(1);
}

let transporter;

if (transportMode === 'sendmail') {
  transporter = nodemailer.createTransport({
    sendmail: true,
    path: process.env.SENDMAIL_PATH?.trim() || '/usr/sbin/sendmail',
    newline: 'unix',
  });
} else {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host) {
    console.error('Defina SMTP_HOST (ex.: mail.aamihe.com ou 127.0.0.1 no servidor).');
    process.exit(1);
  }

  const local = host === '127.0.0.1' || host === 'localhost';
  const geralUser = process.env.SMTP_GERAL_USER?.trim() || 'geral@aamihe.com';
  const geralPass = process.env.SMTP_GERAL_PASS?.trim();
  const fromEmail = (from.match(/<([^>]+)>/) || [])[1]?.toLowerCase() || from.toLowerCase();

  let authUser = user;
  let authPass = pass;
  if (fromEmail === geralUser.toLowerCase() && geralPass) {
    authUser = geralUser;
    authPass = geralPass;
  }

  if (!local && (!authUser || !authPass)) {
    console.error(
      'Defina SMTP_USER/SMTP_PASS (noreply) e/ou SMTP_GERAL_PASS (geral) no DirectAdmin.',
    );
    process.exit(1);
  }

  if (!local && looksLikePlaceholder(authPass)) {
    const varName =
      authUser?.toLowerCase() === geralUser.toLowerCase() ? 'SMTP_GERAL_PASS' : 'SMTP_PASS';
    console.error(`A variável ${varName} em .env.local ainda é um placeholder.`);
    console.error('No DirectAdmin → Email Accounts → repor palavra-passe da conta e colar em .env.local.');
    console.error(`Conta em teste: ${authUser}`);
    process.exit(1);
  }

  console.log(`A testar SMTP como ${authUser} @ ${host}:${port} …`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: authUser && authPass ? { user: authUser, pass: authPass } : undefined,
  });
}

try {
  await transporter.verify();
  console.log('Ligação SMTP OK');
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('Falha na ligação SMTP:', msg);
  if (/535|incorrect authentication/i.test(msg)) {
    console.error('');
    console.error('Erro 535 = palavra-passe incorrecta no DirectAdmin ou variável errada na Vercel.');
    console.error('Confirme a palavra-passe em DirectAdmin → Email Accounts e actualize .env.local / Vercel.');
  }
  process.exit(1);
}

const info = await transporter.sendMail({
  from,
  to,
  subject: 'Teste AAMIHE — envio SMTP',
  text: 'Se recebeu esta mensagem, o SMTP (DirectAdmin/Exim) está configurado correctamente.',
  html: '<p>Se recebeu esta mensagem, o <strong>SMTP</strong> (DirectAdmin/Exim) está configurado correctamente.</p>',
});

console.log('Enviado:', info.messageId || info.response);
