import path from 'node:path';
import { canDeleteMedia, isSupabaseStorageUrl } from '@/lib/media-catalog-key';
import { findMediaRecordById, invalidateGalleryCatalogCache } from '@/lib/media-registry';
import {
  deleteBlobFile,
  deleteLocalPublicFile,
  isVercelBlobUrl,
  movePublicFileToTrash,
  restorePublicFileFromTrash,
} from '@/lib/media-storage';
import { isLocalMediaPath } from '@/lib/media-catalog-key';
import type { SiteMediaRecord } from '@/lib/site-media';
import {
  addTrashedMedia,
  getTrashedMedia,
  listTrashedMedia,
  removeTrashedMedia,
  type TrashedMediaRecord,
} from '@/lib/media-trash-store';
import { deleteSupabaseMedia, getSupabaseMediaByUrl } from '@/lib/supabase-media';
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

  return null;
}

async function resolveMediaRecord(input: MediaDeleteInput): Promise<SiteMediaRecord | null> {
  if (input.url?.trim()) {
    const byUrl = await findRecordByUrl(input.url.trim());
    if (byUrl) return byUrl;
  }

  const byId = await findMediaRecordById(input.id);
  if (byId) return byId;

  if (input.url?.trim()) {
    const url = input.url.trim();
    return {
      id: input.id,
      site_slug: 'aamihe',
      title: path.basename(url),
      url,
      mime_type: 'image/jpeg',
      category: 'imagens',
      subcategory: 'Galeria',
      source: 'upload',
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

function trashedIdFor(record: SiteMediaRecord, trashUrl: string): string {
  return `trash_${record.id}_${path.basename(trashUrl)}`;
}

/** Move item para reciclagem (predefinido). permanent=true elimina de forma irreversível. */
export async function deleteMediaItem(
  input: MediaDeleteInput,
  options?: { permanent?: boolean },
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { id } = input;

  if (!id) {
    return { ok: false, error: 'ID em falta', status: 400 };
  }

  if (options?.permanent) {
    const trashed = await getTrashedMedia(id);
    if (!trashed) {
      return { ok: false, error: 'Item não encontrado na reciclagem.', status: 404 };
    }
    await deleteLocalPublicFile(trashed.trash_path);
    await removeTrashedMedia(id);
    if (isSupabaseConfigured()) {
      await deleteSupabaseMedia(trashed.id);
    }
    invalidateGalleryCatalogCache();
    return { ok: true };
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

  if (isLocalMediaPath(targetUrl)) {
    const moved = await movePublicFileToTrash(targetUrl);
    if (!moved) {
      return {
        ok: false,
        error: 'Não foi possível mover o ficheiro para a reciclagem.',
        status: 500,
      };
    }

    const trashId = trashedIdFor(record, moved.trashUrl);
    await addTrashedMedia({
      id: trashId,
      url: targetUrl,
      trash_path: moved.trashUrl,
      title: record.title,
      mime_type: record.mime_type,
      size: record.size,
      subcategory: record.subcategory,
      category: record.category,
      source: record.source,
      deleted_at: new Date().toISOString(),
    });
  } else if (isVercelBlobUrl(targetUrl)) {
    await deleteBlobFile(targetUrl);
  }

  if (isSupabaseConfigured()) {
    const supabaseOk = await deleteSupabaseMedia(record.id);
    if (
      !supabaseOk &&
      isSupabaseStorageUrl(record.url) &&
      !isLocalMediaPath(targetUrl) &&
      !isVercelBlobUrl(targetUrl)
    ) {
      return {
        ok: false,
        error: 'Não foi possível eliminar o registo na base de dados (Supabase).',
        status: 500,
      };
    }
  }

  invalidateGalleryCatalogCache();
  return { ok: true };
}

export async function restoreMediaItem(
  trashId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string; status: number }> {
  const trashed = await getTrashedMedia(trashId);
  if (!trashed) {
    return { ok: false, error: 'Item não encontrado na reciclagem.', status: 404 };
  }

  const restoredUrl = await restorePublicFileFromTrash(trashed.trash_path, trashed.url);
  if (!restoredUrl) {
    return { ok: false, error: 'Não foi possível restaurar o ficheiro.', status: 500 };
  }

  await removeTrashedMedia(trashId);
  invalidateGalleryCatalogCache();
  return { ok: true, url: restoredUrl };
}

export async function restoreMediaItems(
  ids: string[],
): Promise<{ restored: number; failed: { id: string; error: string }[]; urls: string[] }> {
  const failed: { id: string; error: string }[] = [];
  const urls: string[] = [];
  let restored = 0;

  for (const id of ids) {
    const result = await restoreMediaItem(id);
    if (result.ok) {
      restored += 1;
      urls.push(result.url);
    } else {
      failed.push({ id, error: result.error });
    }
  }

  if (restored > 0) {
    invalidateGalleryCatalogCache();
  }

  return { restored, failed, urls };
}

export async function listMediaTrash(): Promise<TrashedMediaRecord[]> {
  return listTrashedMedia();
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
