import type { SitePageConfig } from '@/lib/site-page-config';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export type SiteSettingsPayload = {
  /** Layout blog, contactos e comportamento de scroll. */
  publicPages?: SitePageConfig;
  // Geral
  siteName?: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  googleAnalyticsId?: string;
  maintenanceMode?: boolean;
  // Noticias
  postsPerPage?: number;
  defaultCategory?: string;
  enableComments?: boolean;
  moderateComments?: boolean;
  autoPublish?: boolean;
  notifyOnNewPost?: boolean;
  // Utilizadores
  allowRegistration?: boolean;
  requireEmailVerification?: boolean;
  defaultRole?: string;
  disableInactiveUsers?: boolean;
  sessionTimeout?: number;
  // Media
  maxUploadSize?: number;
  allowedFormats?: string[];
  autoCompress?: boolean;
  compressQuality?: number;
  createThumbnails?: boolean;
  thumbnailSize?: number;
  // Seguranca
  forceHTTPS?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  requireStrongPassword?: boolean;
  twoFactorAuth?: boolean;
  ipWhitelist?: string;
  // Backup
  autoBackup?: boolean;
  backupFrequency?: string;
  backupTime?: string;
  keepBackups?: number;
  includeMedia?: boolean;
};

// We store settings inside the existing site_content table using a dedicated slug
const SETTINGS_SLUG = 'aamihe_settings';

export async function loadSiteSettings(): Promise<SiteSettingsPayload | null> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) return null;

  const { data, error } = await admin
    .from('site_content')
    .select('news')
    .eq('site_slug', SETTINGS_SLUG)
    .maybeSingle();

  if (error) {
    console.error('Supabase load site_settings:', error.message);
    return null;
  }

  if (!data) return null;
  const raw = data.news;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SiteSettingsPayload;
  }
  return null;
}

export async function saveSiteSettings(settings: SiteSettingsPayload): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSupabaseConfigured()) return false;

  const { error } = await admin.from('site_content').upsert(
    {
      site_slug: SETTINGS_SLUG,
      // Store settings in the "news" JSONB column
      news: settings as unknown as Record<string, unknown>,
      categories: [],
      documents: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'site_slug' }
  );

  if (error) {
    console.error('Supabase save site_settings:', error.message);
    return false;
  }

  return true;
}
