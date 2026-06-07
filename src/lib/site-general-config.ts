import {
  DEFAULT_SITE_PAGE_CONFIG,
  mergeSitePageConfig,
  type SitePageConfig,
} from '@/lib/site-page-config';
import type { SiteSettingsPayload } from '@/lib/supabase-settings';

export type SocialLinksConfig = {
  twitter: string;
  facebook: string;
  instagram: string;
  linkedin: string;
};

export type FooterLinkConfig = {
  name: string;
  href: string;
};

export type SiteGeneralConfig = {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  googleAnalyticsId: string;
  maintenanceMode: boolean;
  maintenanceImageUrl: string;
  socialLinks: SocialLinksConfig;
  footerLinks: FooterLinkConfig[];
};

export const DEFAULT_LOGO_URL = '/Logo-Small.png.webp';
export const DEFAULT_FAVICON_URL = '/favicon.png';
export const DEFAULT_MAINTENANCE_IMAGE_URL = '/gallery/login-bg.jpg';

export const DEFAULT_FOOTER_LINKS: FooterLinkConfig[] = [
  { name: 'Direcção', href: '/#direcao' },
  { name: 'Galeria de fotos', href: '/galeria' },
  { name: 'Documentos', href: '/galeria?tipo=documentos' },
  { name: 'Eventos', href: '/noticias' },
  { name: 'Países Membros', href: '/paises' },
  { name: 'Universidades filiais', href: '/universidades' },
  { name: 'Arquivo', href: '/arquivo' },
];

export const DEFAULT_SITE_GENERAL_CONFIG: SiteGeneralConfig = {
  siteName: 'AAMIHE',
  siteDescription:
    'A AAMIHE é uma associação de instituições de ensino superior da Igreja Metodista Unida em África.',
  logoUrl: DEFAULT_LOGO_URL,
  faviconUrl: DEFAULT_FAVICON_URL,
  contactEmail: DEFAULT_SITE_PAGE_CONFIG.contact.contactEmail,
  contactPhone: DEFAULT_SITE_PAGE_CONFIG.contact.contactPhone,
  address: DEFAULT_SITE_PAGE_CONFIG.contact.address,
  googleAnalyticsId: '',
  maintenanceMode: false,
  maintenanceImageUrl: DEFAULT_MAINTENANCE_IMAGE_URL,
  socialLinks: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  },
  footerLinks: DEFAULT_FOOTER_LINKS,
};

function mergeSocialLinks(partial?: Partial<SocialLinksConfig> | null): SocialLinksConfig {
  return {
    ...DEFAULT_SITE_GENERAL_CONFIG.socialLinks,
    ...(partial ?? {}),
  };
}

function mergeFooterLinks(partial?: FooterLinkConfig[] | null): FooterLinkConfig[] {
  if (!partial?.length) return DEFAULT_FOOTER_LINKS;
  return partial.map((link) => ({ ...link }));
}

export function mergeSiteGeneralConfig(partial?: Partial<SiteGeneralConfig> | null): SiteGeneralConfig {
  if (!partial) return DEFAULT_SITE_GENERAL_CONFIG;
  return {
    ...DEFAULT_SITE_GENERAL_CONFIG,
    ...partial,
    socialLinks: mergeSocialLinks(partial.socialLinks),
    footerLinks: mergeFooterLinks(partial.footerLinks),
  };
}

/** Extrai configuração geral a partir das definições guardadas + valores por defeito do site. */
export function settingsToGeneralConfig(settings: SiteSettingsPayload | null | undefined): SiteGeneralConfig {
  const contact = mergeSitePageConfig(settings?.publicPages ?? null).contact;
  return mergeSiteGeneralConfig({
    siteName: settings?.siteName,
    siteDescription: settings?.siteDescription,
    logoUrl: settings?.logoUrl || DEFAULT_LOGO_URL,
    faviconUrl: settings?.faviconUrl || DEFAULT_FAVICON_URL,
    contactEmail: settings?.contactEmail ?? contact.contactEmail,
    contactPhone: settings?.contactPhone ?? contact.contactPhone,
    address: settings?.address ?? contact.address,
    googleAnalyticsId: settings?.googleAnalyticsId,
    maintenanceMode: settings?.maintenanceMode,
    maintenanceImageUrl: settings?.maintenanceImageUrl || DEFAULT_MAINTENANCE_IMAGE_URL,
    socialLinks: settings?.socialLinks,
    footerLinks: settings?.footerLinks,
  });
}

/** Converte formulário de definições gerais para payload Supabase (inclui sync de contactos). */
export function generalConfigToSettingsPayload(
  config: SiteGeneralConfig,
  existing: SiteSettingsPayload | null | undefined,
): SiteSettingsPayload {
  const publicPages: SitePageConfig = mergeSitePageConfig(existing?.publicPages ?? null);
  return {
    ...(existing ?? {}),
    siteName: config.siteName,
    siteDescription: config.siteDescription,
    logoUrl: config.logoUrl,
    faviconUrl: config.faviconUrl,
    contactEmail: config.contactEmail,
    contactPhone: config.contactPhone,
    address: config.address,
    googleAnalyticsId: config.googleAnalyticsId,
    maintenanceMode: config.maintenanceMode,
    maintenanceImageUrl: config.maintenanceImageUrl,
    socialLinks: config.socialLinks,
    footerLinks: config.footerLinks,
    publicPages: {
      ...publicPages,
      contact: {
        ...publicPages.contact,
        contactEmail: config.contactEmail,
        contactPhone: config.contactPhone,
        address: config.address,
      },
    },
  };
}
