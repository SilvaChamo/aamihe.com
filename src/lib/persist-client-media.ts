import { dispatchMediaUpdated } from '@/lib/media-events';

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

export function isImageUploadFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name);
}

export async function uploadMediaFile(file: File, subcategory = 'Upload'): Promise<string> {
  const results = await uploadMediaFiles([file], subcategory);
  return results[0];
}

export async function uploadMediaFiles(files: File[], subcategory = 'Upload'): Promise<string[]> {
  if (files.length === 0) return [];

  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  form.append('subcategory', subcategory);
  if (files.length === 1) {
    form.append('title', files[0].name);
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
