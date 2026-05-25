import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getDashboardDb, saveDashboardDb } from '@/lib/dashboard-db';
import { upsertMediaRecord } from '@/lib/media-registry';
import {
  collectUrlsFromReferenceHtml,
  resolveMissingPublicImage,
} from '@/lib/reference-image-sync';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { upsertSupabaseMedia, uploadFileToStore } from '@/lib/supabase-media';

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
    await saveDashboardDb(db);

    let supabaseSynced = 0;
    if (isSupabaseConfigured()) {
      for (const record of db.media.filter((r) => r.published && r.url.startsWith('/'))) {
        const filePath = path.join(process.cwd(), 'public', record.url.replace(/^\//, ''));
        try {
          const buffer = await readFile(filePath);
          const uploaded = await uploadFileToStore(
            buffer,
            path.basename(record.url),
            record.mime_type,
            'imagens',
            record.subcategory
          );
          const saved = upsertMediaRecord(db, {
            ...record,
            url: uploaded.url,
            id: record.id,
          });
          await upsertSupabaseMedia(saved);
          supabaseSynced += 1;
        } catch {
          /* ficheiro ainda inexistente */
        }
      }
      await saveDashboardDb(db);
    }

    return NextResponse.json({
      success: true,
      restored: uniqueRestored.length,
      restored_paths: uniqueRestored.slice(0, 50),
      supabase_synced: supabaseSynced,
      supabase: isSupabaseConfigured(),
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Erro na sincronização';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
