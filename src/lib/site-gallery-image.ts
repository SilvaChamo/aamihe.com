import { legacyPublicPathToSupabaseUrl } from '@/lib/supabase-asset-url';

/** Converte caminho legado (/gallery/, /images/) para URL Supabase Storage. */
export function siteGalleryImage(localPath: string): string {
  return legacyPublicPathToSupabaseUrl(localPath) ?? localPath;
}
