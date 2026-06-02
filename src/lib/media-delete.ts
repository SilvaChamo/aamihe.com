import path from 'node:path';
import { readdir, unlink } from 'node:fs/promises';
import { canDeleteMedia, isSupabaseStorageUrl, mediaUniqueBasename } from '@/lib/media-catalog-key';
import { findMediaRecordById } from '@/lib/media-registry';
import { deleteBlobFile, deleteLocalPublicFile, isVercelBlobUrl } from '@/lib/media-storage';
import { isLocalMediaPath } from '@/lib/media-catalog-key';
import type { SiteMediaRecord } from '@/lib/site-media';
import { deleteSupabaseMedia, deleteSupabaseMediaRelated, getSupabaseMediaByUrl } from '@/lib/supabase-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export type MediaDeleteInput = {
  id: string;
  url?: string;
};

async function findRecordByUrl(url: string): Promise<SiteMediaRecord | null> {
  const normalized = url.trim();
  if (!normalized) return null;

  if (isSupabaseConfigured()) {
    const fromDb = await getSupabaseMediaByUrl(normalized);
    if (fromDb) return fromDb;
  }

  if (normalized.startsWith('/')) {
    const { collectAllSiteImages } = await import('@/lib/collect-site-images');
    const collected = await collectAllSiteImages();
    return collected.find((m) => m.url === normalized) ?? null;
  }

  return null;
}

async function resolveMediaRecord(input: MediaDeleteInput): Promise<SiteMediaRecord | null> {
  if (input.url?.trim()) {
    const byUrl = await findRecordByUrl(input.url.trim());
    if (byUrl) return byUrl;
  }

  const byId = await findMediaRecordById(input.id);
  if (byId) return byId;

  return null;
}

export async function deleteGalleryFilesByBasename(urlOrBasename: string): Promise<number> {
  const key = urlOrBasename.includes('/')
    ? mediaUniqueBasename(urlOrBasename)
    : mediaUniqueBasename(`/gallery/${urlOrBasename}`);
  if (!key) return 0;

  const galleryDir = path.join(process.cwd(), 'public', 'gallery');
  let removed = 0;

  try {
    const entries = await readdir(galleryDir);
    for (const name of entries) {
      const fileKey = mediaUniqueBasename(`/gallery/${name}`);
      if (fileKey !== key && name.toLowerCase() !== key) continue;
      try {
        await unlink(path.join(galleryDir, name));
        removed += 1;
      } catch (error: unknown) {
        const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
        if (code !== 'ENOENT') throw error;
      }
    }
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code !== 'ENOENT') {
      console.error('deleteGalleryFilesByBasename:', error);
    }
  }

  return removed;
}

export async function deleteMediaItem(
  input: MediaDeleteInput,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { id } = input;

  if (!id) {
    return { ok: false, error: 'ID em falta', status: 400 };
  }

  if (id.startsWith('wp_') || id.startsWith('doc_media_')) {
    return {
      ok: false,
      error: 'Itens do arquivo HTML legado não podem ser eliminados aqui.',
      status: 400,
    };
  }

  const record = await resolveMediaRecord(input);

  if (!record) {
    return { ok: false, error: 'Item não encontrado.', status: 404 };
  }

  if (!canDeleteMedia(record)) {
    return { ok: false, error: 'Este item não pode ser eliminado.', status: 400 };
  }

  const targetUrl = record.url;
  const basename = mediaUniqueBasename(targetUrl);

  if (isLocalMediaPath(targetUrl)) {
    const removed = await deleteLocalPublicFile(targetUrl);
    if (!removed) {
      return {
        ok: false,
        error: 'Não foi possível eliminar o ficheiro no servidor.',
        status: 500,
      };
    }
  }

  if (isVercelBlobUrl(targetUrl)) {
    await deleteBlobFile(targetUrl);
  }

  if (basename) {
    await deleteGalleryFilesByBasename(basename);
  }

  if (isSupabaseConfigured()) {
    await deleteSupabaseMediaRelated(targetUrl);
    if (input.id !== record.id) {
      await deleteSupabaseMedia(input.id);
    }
    const supabaseOk = await deleteSupabaseMedia(record.id);
    const removedLocal = isLocalMediaPath(targetUrl);
    const removedBlob = isVercelBlobUrl(targetUrl);
    if (
      !supabaseOk &&
      isSupabaseStorageUrl(record.url) &&
      !removedLocal &&
      !removedBlob
    ) {
      return {
        ok: false,
        error: 'Não foi possível eliminar o registo na base de dados (Supabase).',
        status: 500,
      };
    }
  }

  return { ok: true };
}

export async function deleteMediaItems(
  items: MediaDeleteInput[],
): Promise<{ deleted: number; failed: { id: string; error: string }[] }> {
  const failed: { id: string; error: string }[] = [];
  let deleted = 0;

  for (const item of items) {
    const result = await deleteMediaItem(item);
    if (result.ok) {
      deleted += 1;
    } else {
      failed.push({ id: item.id, error: result.error });
    }
  }

  return { deleted, failed };
}
