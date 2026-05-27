/** Configuração das páginas públicas (blog, contactos). */
export type SitePageConfig = {
  blog: {
    postsPerPage: number;
    gridColumns: number;
    bannerTitle: string;
    bannerImage: string;
    scrollToTopOnPaginate: boolean;
    scrollTargetOnPaginate: 'banner' | 'entries';
  };
  contact: {
    bannerTitle: string;
    bannerImage: string;
    mapEmbedUrl: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
};

export const DEFAULT_SITE_PAGE_CONFIG: SitePageConfig = {
  blog: {
    postsPerPage: 3,
    gridColumns: 3,
    bannerTitle: 'BLOG',
    bannerImage: '/Imagens/BgNoticias.jpeg',
    scrollToTopOnPaginate: true,
    scrollTargetOnPaginate: 'banner',
  },
  contact: {
    bannerTitle: 'CONTACTE-NOS',
    bannerImage: '/Imagens/BgNoticias.jpeg',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=Pestana%20Rovuma%20Hotel,%20Maputo&t=&z=15&ie=UTF8&iwloc=&output=embed',
    contactEmail: 'geral@aamihe.com',
    contactPhone: '+258 84 308 9820',
    address: 'Rua da Sé nº 114, Pestana Rovuma Hotel',
  },
};

export function mergeSitePageConfig(partial?: Partial<SitePageConfig> | null): SitePageConfig {
  if (!partial) return DEFAULT_SITE_PAGE_CONFIG;
  return {
    blog: { ...DEFAULT_SITE_PAGE_CONFIG.blog, ...partial.blog },
    contact: { ...DEFAULT_SITE_PAGE_CONFIG.contact, ...partial.contact },
  };
}
