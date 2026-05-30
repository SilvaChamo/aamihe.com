import { saveUploadedBuffer } from '@/lib/persist-media';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export async function storeConferenceFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<string> {
  if (isSupabaseConfigured()) {
    const { uploadFileToStore } = await import('@/lib/supabase-media');
    const record = await uploadFileToStore(
      buffer,
      originalName,
      mimeType,
      'documentos',
      'Conferência',
    );
    return record.url;
  }

  const saved = await saveUploadedBuffer(buffer, originalName, 'uploads/conferencia');
  return saved.url;
}
