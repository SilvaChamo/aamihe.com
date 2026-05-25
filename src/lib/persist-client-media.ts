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
  const data = await res.json();

  if (!data.success || !data.media?.url) {
    throw new Error(data.error || 'Erro ao guardar imagem na galeria');
  }

  return data.media.url;
}

export async function uploadMediaFile(file: File, subcategory = 'Upload'): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('subcategory', subcategory);
  form.append('title', file.name);

  const res = await fetch('/api/admin/media', { method: 'POST', body: form });
  const data = await res.json();

  if (!data.success || !data.media?.url) {
    throw new Error(data.error || 'Erro no upload');
  }

  return data.media.url;
}
