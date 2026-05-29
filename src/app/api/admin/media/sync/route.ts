import { NextResponse } from 'next/server';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { buildMediaCatalog, upsertMediaRecord } from '@/lib/media-registry';
import {
  collectUrlsFromReferenceHtml,
  getReferenceIndex,
  resolveMissingPublicImage,
} from '@/lib/reference-image-sync';
import { mediaCatalogKey } from '@/lib/media-catalog-key';
import { isSupabaseConfigured, getSupabaseAdmin, MEDIA_BUCKET } from '@/lib/supabase/server';
import { upsertSupabaseMedia } from '@/lib/supabase-media';
import type { SiteMediaRecord } from '@/lib/site-media';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP = /(?:^|\/)(pt_PT|fr_FR|en_GB)\.png$|Logo-Small|cropped-Logo|favicon/i;

function mimeFromExt(ext: string) {
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function stableId(relativePath: string) {
  return `site_${createHash('sha1').update(relativePath).digest('hex').slice(0, 12)}`;
}

function sanitizeStorageRel(relPath: string) {
  const normalized = relPath
    .replace(/\\/g, '/')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w./-]+/g, '-')
    .replace(/-+/g, '-');
  return normalized.startsWith('legacy/') ? normalized : `legacy/${normalized}`;
}

function titleFromName(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subcategoryFor(relPath: string, filename: string) {
  if (relPath.startsWith('gallery/')) {
    return filename.startsWith('news-') ? 'Notícias' : 'Galeria';
  }
  if (relPath.startsWith('uploads/imagens/')) return 'Notícias';
  if (relPath.startsWith('images/paises/')) return 'Países membros';
  if (relPath.startsWith('images/')) return 'Site';
  if (relPath.startsWith('Blog_files/')) return 'Blog';
  return 'Galeria';
}

async function walkPublicImages(dir: string, prefix = ''): Promise<{ full: string; rel: string; name: string }[]> {
  const results: { full: string; rel: string; name: string }[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkPublicImages(full, rel)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext) || SKIP.test(rel)) continue;
    results.push({ full, rel, name: entry.name });
  }
  return results;
}

async function uploadLocalFileToSupabase(
  filePath: string,
  relPath: string
): Promise<SiteMediaRecord | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = mimeFromExt(ext);
  const storagePathFinal = sanitizeStorageRel(relPath);
  const id = stableId(storagePathFinal);
  const subcategory = subcategoryFor(relPath, path.basename(filePath));

  const { error: uploadError } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(storagePathFinal, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.error('Storage upload', relPath, uploadError.message);
    return null;
  }

  const { data: publicData } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(storagePathFinal);
  const record: SiteMediaRecord = {
    id,
    site_slug: 'aamihe',
    title: titleFromName(path.basename(filePath)),
    url: publicData.publicUrl,
    category: 'imagens',
    subcategory,
    mime_type: mimeType,
    size: buffer.length,
    source: 'upload',
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return upsertSupabaseMedia({ ...record, storage_path: storagePathFinal, catalog_key: mediaCatalogKey(record.url) });
}

export async function POST() {
  try {
    const db = await getDashboardDb();
    const restored: string[] = [];

    for (const item of db.media) {
      if (!item.url.startsWith('/')) continue;
      const resolved = await resolveMissingPublicImage(item.url);
      if (resolved !== item.url) {
        item.url = resolved;
        restored.push(resolved);
      }
    }

    const htmlUrls = await collectUrlsFromReferenceHtml();
    for (const url of htmlUrls) {
      if (!url.startsWith('/')) continue;
      const resolved = await resolveMissingPublicImage(url);
      if (resolved.startsWith('/')) restored.push(resolved);
    }

    const uniqueRestored = [...new Set(restored)];

    let supabaseSynced = 0;
    const failed: string[] = [];

    if (isSupabaseConfigured()) {
      const publicRoot = path.join(process.cwd(), 'public');
      const publicFiles = await walkPublicImages(publicRoot);
      const seenStorage = new Set<string>();
      const queue: { full: string; rel: string; name: string }[] = [];

      for (const file of publicFiles) {
        const storageRel = sanitizeStorageRel(file.rel);
        if (seenStorage.has(storageRel)) continue;
        seenStorage.add(storageRel);
        queue.push(file);
      }

      const refIndex = await getReferenceIndex();
      for (const [, refPath] of refIndex) {
        const name = path.basename(refPath);
        const ext = path.extname(name).toLowerCase();
        if (!IMAGE_EXT.has(ext) || SKIP.test(name)) continue;
        const rel = `ref/${name}`;
        const storageRel = sanitizeStorageRel(rel);
        if (seenStorage.has(storageRel)) continue;
        seenStorage.add(storageRel);
        queue.push({ full: refPath, rel, name });
      }

      for (const file of queue) {
        try {
          const saved = await uploadLocalFileToSupabase(file.full, file.rel);
          if (saved) {
            upsertMediaRecord(db, saved);
            supabaseSynced += 1;
          } else {
            failed.push(file.rel);
          }
        } catch (err) {
          failed.push(file.rel);
          console.error(file.rel, err);
        }
      }

      for (const record of db.media.filter((r) => r.published && r.url.startsWith('/'))) {
        const filePath = path.join(publicRoot, record.url.replace(/^\//, ''));
        try {
          const saved = await uploadLocalFileToSupabase(filePath, record.url.replace(/^\//, ''));
          if (saved) {
            Object.assign(record, { url: saved.url, updated_at: new Date().toISOString() });
            supabaseSynced += 1;
          }
        } catch {
          failed.push(record.url);
        }
      }
    }

    await saveDashboardDb(db);

    let cleanupStats = null;
    if (isSupabaseConfigured()) {
      const { cleanupMediaCatalog } = await import('@/lib/media-catalog-cleanup');
      cleanupStats = await cleanupMediaCatalog();
    }

    const totalInSupabase = isSupabaseConfigured() ? (await buildMediaCatalog(db)).length : 0;

    return NextResponse.json({
      success: true,
      restored: uniqueRestored.length,
      supabase_synced: supabaseSynced,
      catalog_cleanup: cleanupStats,
      catalog_total: totalInSupabase,
      failed_count: failed.length,
      failed_sample: failed.slice(0, 10),
      supabase: isSupabaseConfigured(),
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro na sincronização';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
