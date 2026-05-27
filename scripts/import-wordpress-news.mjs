#!/usr/bin/env node
/**
 * Importa notícias do export WordPress (WXR) para wordpress-news.json e Supabase.
 * Uso: node scripts/import-wordpress-news.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFile, writeFile, readdir, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const XML_CANDIDATES = [
  path.join(root, 'MATERIAL–WEB', 'aamihe.WordPress.2026-05-27.xml'),
  path.join(root, 'MATERIAL-WEB', 'aamihe.WordPress.2026-05-27.xml'),
];

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CATEGORY_MAP = {
  informacao: 'Institucional',
  'informacao-academica': 'Educação',
};

function extractTag(block, tag) {
  const cdata = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i').exec(block);
  if (cdata) return cdata[1].trim();
  const plain = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i').exec(block);
  return plain ? plain[1].trim() : '';
}

function formatPtDate(wpDate) {
  if (!wpDate) return '';
  const [datePart] = wpDate.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return wpDate;
  return `${d} ${PT_MONTHS[m - 1]}, ${y}`;
}

function stripHtmlToText(html, max = 200) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeContent(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n');
}

function parseCategory(block) {
  const m = block.match(
    /<category domain="category" nicename="([^"]+)"><!\[CDATA\[([^\]]+)\]\]><\/category>/i,
  );
  if (!m) return 'Institucional';
  const mapped = CATEGORY_MAP[m[1].toLowerCase()];
  if (mapped) return mapped;
  const label = m[2].trim();
  if (/acad/i.test(label)) return 'Educação';
  if (/informa/i.test(label)) return 'Institucional';
  return label.charAt(0) + label.slice(1).toLowerCase();
}

function parseThumbnailId(block) {
  const re = /<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]><\/wp:meta_value>/gi;
  let last = '';
  let m;
  while ((m = re.exec(block)) !== null) last = m[1];
  return last;
}

function parseWxR(xml) {
  const attachments = new Map();
  const postBlocks = [];

  const items = xml.split(/<item>/).slice(1);
  for (const chunk of items) {
    const block = chunk.split('</item>')[0];
    const postType = extractTag(block, 'wp:post_type');
    const postId = Number(extractTag(block, 'wp:post_id'));

    if (postType === 'attachment') {
      const url = extractTag(block, 'wp:attachment_url');
      if (postId && url) attachments.set(postId, url);
      continue;
    }

    if (postType === 'post' && extractTag(block, 'wp:status') === 'publish') {
      postBlocks.push(block);
    }
  }

  const posts = postBlocks.map((block) => {
    const postId = Number(extractTag(block, 'wp:post_id'));
    const content = normalizeContent(extractTag(block, 'content:encoded'));
    const thumbId = Number(parseThumbnailId(block));
    const imageUrl = thumbId ? attachments.get(thumbId) ?? '' : '';

    return {
      id: postId,
      date: formatPtDate(extractTag(block, 'wp:post_date')),
      title: extractTag(block, 'title'),
      content,
      image: imageUrl,
      category: parseCategory(block),
      summary: stripHtmlToText(content),
      author: extractTag(block, 'dc:creator') || 'Admin',
      status: 'published',
    };
  });

  return posts.sort((a, b) => b.id - a.id);
}

async function loadEnv() {
  const envPath = path.join(root, '.env.local');
  try {
    const raw = await readFile(envPath, 'utf8');
    const env = {};
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

function basenameFromUrl(url) {
  try {
    return decodeURIComponent(path.basename(new URL(url).pathname));
  } catch {
    return path.basename(url);
  }
}

async function resolveLocalImage(wpUrl, galleryFiles) {
  if (!wpUrl) return '/gallery/Imagem1.jpg.webp';

  const base = basenameFromUrl(wpUrl);
  const stem = base.replace(/\.(jpe?g|png|gif|webp)$/i, '').toLowerCase();
  const gallerySet = new Set(galleryFiles.map((f) => f.toLowerCase()));

  const candidates = [
    base,
    `${base}.webp`,
    `${stem}.webp`,
    `${stem}.jpeg.webp`,
    `${stem}.jpg.webp`,
    `${stem}-300x225.jpeg.webp`,
    `${stem}-300x200.jpg.webp`,
    `${stem}-150x150.jpeg.webp`,
    `${stem}-768x432-1.jpg.webp`,
  ].map((n) => n.toLowerCase());

  for (const name of candidates) {
    if (gallerySet.has(name)) {
      const actual = galleryFiles.find((f) => f.toLowerCase() === name);
      return `/gallery/${actual ?? name}`;
    }
  }

  const galleryDir = path.join(root, 'public/gallery');
  const fuzzy = galleryFiles.find((f) => {
    const low = f.toLowerCase();
    return low.includes(stem) || stem.includes(low.replace(/\.(jpe?g|png|gif|webp)+$/i, ''));
  });
  if (fuzzy) return `/gallery/${fuzzy}`;

  const destName = base.endsWith('.webp') ? base : `${stem}.jpg`;
  const destPath = path.join(galleryDir, destName);
  try {
    await access(destPath);
    return `/gallery/${destName}`;
  } catch {
    /* download below */
  }

  try {
    const res = await fetch(wpUrl, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buf);
    console.log(`  ↓ imagem: ${destName}`);
    galleryFiles.push(destName);
    return `/gallery/${destName}`;
  } catch (err) {
    console.warn(`  ⚠ imagem não obtida (${base}): ${err.message}`);
    return '/gallery/Imagem1.jpg.webp';
  }
}

async function saveToSupabase(news, env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('Supabase: variáveis em falta — só foi gerado wordpress-news.json');
    return false;
  }

  const admin = createClient(url, key);
  const { data: row } = await admin
    .from('site_content')
    .select('categories, documents')
    .eq('site_slug', 'aamihe')
    .maybeSingle();

  const defaultCategories = [
    { name: 'Institucional', slug: 'institucional', description: '', etiqueta: '' },
    { name: 'Educação', slug: 'educacao', description: '', etiqueta: '' },
    { name: 'Desenvolvimento', slug: 'desenvolvimento', description: '', etiqueta: '' },
    { name: 'Eventos', slug: 'eventos', description: '', etiqueta: '' },
  ];

  const { error } = await admin.from('site_content').upsert(
    {
      site_slug: 'aamihe',
      news,
      categories: row?.categories?.length ? row.categories : defaultCategories,
      documents: row?.documents ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_slug' },
  );

  if (error) {
    console.error('Supabase:', error.message);
    return false;
  }
  return true;
}

async function main() {
  let xmlPath = null;
  for (const p of XML_CANDIDATES) {
    try {
      await access(p);
      xmlPath = p;
      break;
    } catch {
      /* try next */
    }
  }
  if (!xmlPath) {
    console.error('Ficheiro XML não encontrado em MATERIAL–WEB/');
    process.exit(1);
  }

  console.log('A ler:', path.basename(xmlPath));
  const xml = await readFile(xmlPath, 'utf8');
  const parsed = parseWxR(xml);
  console.log(`Encontrados ${parsed.length} artigos publicados.`);

  const galleryFiles = await readdir(path.join(root, 'public/gallery'));
  const news = [];
  for (const item of parsed) {
    const image = await resolveLocalImage(item.image, galleryFiles);
    news.push({ ...item, image });
    console.log(`  • [${item.id}] ${item.title.slice(0, 60)}…`);
  }

  const outPath = path.join(root, 'src/data/wordpress-news.json');
  await writeFile(outPath, `${JSON.stringify(news, null, 2)}\n`, 'utf8');
  console.log('Gravado:', path.relative(root, outPath));

  const env = await loadEnv();
  const ok = await saveToSupabase(news, env);
  if (ok) console.log(`Supabase: ${news.length} notícias actualizadas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
