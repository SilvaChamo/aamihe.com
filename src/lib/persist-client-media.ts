'use client';

import { compressUploadImage } from '@/lib/compress-image';
import { dispatchMediaUpdated } from '@/lib/media-events';

async function prepareUploadFiles(files: File[]): Promise<File[]> {
  const prepared: File[] = [];
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      prepared.push(await compressUploadImage(file));
    } else {
      prepared.push(file);
    }
  }
  return prepared;
}

export async function persistNewsImage(image: string, title = 'Imagem de notícia'): Promise<string> {
  if (!image) return image;
  const trimmed = image.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const form = new FormData();
  if (trimmed.startsWith('data:')) {
    form.append('data_url', trimmed);
  } else {
    form.append('register_url', trimmed);
  }
  form.append('subcategory', 'Notícias');
  form.append('title', title);

  const res = await fetch('/api/admin/media', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Erro ao guardar imagem (${res.status})`);
  }

  const url = data.media?.url ?? (Array.isArray(data.media) ? data.media[0]?.url : null);
  if (!url) {
    throw new Error(data.error || 'Resposta inválida do servidor');
  }

  dispatchMediaUpdated();
  return url;
}

export async function uploadMediaFile(file: File, subcategory = 'Upload'): Promise<string> {
  const results = await uploadMediaFiles([file], subcategory);
  return results[0];
}

export async function uploadMediaFiles(files: File[], subcategory = 'Upload'): Promise<string[]> {
  if (files.length === 0) return [];

  const prepared = await prepareUploadFiles(files);
  const form = new FormData();
  prepared.forEach((file) => form.append('files', file));
  form.append('subcategory', subcategory);
  if (prepared.length === 1) {
    form.append('title', prepared[0].name);
  }

  const res = await fetch('/api/admin/media', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Erro no upload (${res.status})`);
  }

  dispatchMediaUpdated();

  if (Array.isArray(data.media)) {
    const urls = data.media.map((m: { url?: string }) => m.url).filter(Boolean) as string[];
    if (urls.length === 0) throw new Error('Upload concluído sem URL');
    return urls;
  }
  if (!data.media?.url) {
    throw new Error('Resposta inválida do servidor');
  }
  return [data.media.url];
}
