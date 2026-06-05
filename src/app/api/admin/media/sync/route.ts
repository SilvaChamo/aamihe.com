import { NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildMediaCatalog } from '@/lib/media-registry';
import {
  collectUrlsFromReferenceHtml,
  getReferenceIndex,
  resolveMissingPublicImage,
} from '@/lib/reference-image-sync';
import {
  sanitizeStorageRel,
  uploadLocalFileToSupabase,
} from '@/lib/media-local-upload';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { listSupabaseMedia, upsertSupabaseMedia } from '@/lib/supabase-media';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const SKIP = /(?:^|\/)(pt_PT|fr_FR|en_GB)\.png$|Logo-Small|cropped-Logo|favicon/i;

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

export async function POST() {
  try {
    const restored: string[] = [];

    if (isSupabaseConfigured()) {
      const localRows = await listSupabaseMedia({ all: true });
      for (const item of localRows) {
        if (!item.url.startsWith('/')) continue;
        const resolved = await resolveMissingPublicImage(item.url);
        if (resolved !== item.url) {
          await upsertSupabaseMedia({ ...item, url: resolved });
          restored.push(resolved);
        }
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
            supabaseSynced += 1;
          } else {
            failed.push(file.rel);
          }
        } catch (err) {
          failed.push(file.rel);
          console.error(file.rel, err);
        }
      }

      const localRows = await listSupabaseMedia({ all: true });
      for (const record of localRows.filter((r) => r.published && r.url.startsWith('/'))) {
        const filePath = path.join(publicRoot, record.url.replace(/^\//, ''));
        try {
          const saved = await uploadLocalFileToSupabase(filePath, record.url.replace(/^\//, ''));
          if (saved) supabaseSynced += 1;
        } catch {
          failed.push(record.url);
        }
      }
    }

    let cleanupStats = null;
    if (isSupabaseConfigured()) {
      const { cleanupMediaCatalog } = await import('@/lib/media-catalog-cleanup');
      cleanupStats = await cleanupMediaCatalog();
    }

    const totalInSupabase = isSupabaseConfigured() ? (await buildMediaCatalog()).length : 0;

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
