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

if (!to) {
  console.error('Uso: node scripts/test-email.mjs destino@exemplo.com');
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
  if (!local && (!user || !pass)) {
    console.error('Defina SMTP_USER e SMTP_PASS (conta de e-mail do DirectAdmin).');
    process.exit(1);
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
}

try {
  await transporter.verify();
  console.log('Ligação SMTP OK');
} catch (error) {
  console.error('Falha na ligação SMTP:', error instanceof Error ? error.message : error);
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
