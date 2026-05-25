import { dispatchMediaUpdated } from '@/lib/media-events';

export async function persistNewsImage(image: string, title = 'Imagem de notícia'): Promise<string> {
  if (!image) return image;

  const form = new FormData();
  if (image.startsWith('data:')) {
    form.append('data_url', image);
  } else {
    form.append('register_url', image);
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
