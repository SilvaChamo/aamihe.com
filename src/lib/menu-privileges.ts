import type { SiteSettingsPayload } from '@/lib/supabase-settings';

/** Chaves do menu staff (painel editor). */
export const STAFF_MENU_KEYS = [
  'dashboard',
  'noticias',
  'multimedia',
  'resumos',
  'utilizadores',
  'enviar-email',
  'definicoes',
  'estatisticas',
] as const;

export type StaffMenuKey = (typeof STAFF_MENU_KEYS)[number];

/** Chaves do menu subscritor. */
export const SUBSCRIBER_MENU_KEYS = [
  'dashboard',
  'minha-conta',
  'resumos',
  'notificacoes',
  'definicoes-conta',
] as const;

export type SubscriberMenuKey = (typeof SUBSCRIBER_MENU_KEYS)[number];

export type SubmenuPrivilegeItem = {
  key: string;
  label: string;
  hrefSuffix: string;
};

export const STAFF_SUBMENU_ITEMS: Partial<Record<StaffMenuKey, readonly SubmenuPrivilegeItem[]>> = {
  noticias: [
    { key: 'list', label: 'Todas as Notícias', hrefSuffix: '/noticias' },
    { key: 'nova', label: 'Adicionar Nova', hrefSuffix: '/noticias/nova' },
    { key: 'categorias', label: 'Categorias', hrefSuffix: '/noticias/categorias' },
    { key: 'etiquetas', label: 'Etiquetas', hrefSuffix: '/noticias/etiquetas' },
  ],
  multimedia: [
    { key: 'biblioteca', label: 'Biblioteca', hrefSuffix: '/media' },
    { key: 'documentos', label: 'Documentos', hrefSuffix: '/media/documentos' },
    { key: 'videos', label: 'Vídeos', hrefSuffix: '/media/videos' },
  ],
  utilizadores: [
    { key: 'list', label: 'Todos os Utilizadores', hrefSuffix: '/utilizadores' },
    { key: 'subscritores', label: 'Subscritores Conferência', hrefSuffix: '/utilizadores/subscritores' },
    { key: 'novo', label: 'Adicionar Novo', hrefSuffix: '/utilizadores/novo' },
  ],
  definicoes: [
    { key: 'site', label: 'Configurações do Site', hrefSuffix: '/definicoes' },
    { key: 'noticias', label: 'Notícias', hrefSuffix: '/definicoes/noticias' },
    { key: 'utilizadores', label: 'Utilizadores', hrefSuffix: '/definicoes/utilizadores' },
    { key: 'media', label: 'Media', hrefSuffix: '/definicoes/media' },
    { key: 'seguranca', label: 'Segurança', hrefSuffix: '/definicoes/seguranca' },
    { key: 'backup', label: 'Backup', hrefSuffix: '/definicoes/backup' },
    { key: 'api', label: 'API & Integrações', hrefSuffix: '/definicoes/api' },
  ],
};

export const SUBSCRIBER_SUBMENU_ITEMS: Partial<
  Record<SubscriberMenuKey, readonly SubmenuPrivilegeItem[]>
> = {
  resumos: [
    { key: 'lista', label: 'Meus documentos', hrefSuffix: '/meus-documentos' },
    { key: 'novo', label: 'Novo resumo', hrefSuffix: '/meus-documentos/novo' },
    { key: 'submissao', label: 'Submissão resumo', hrefSuffix: '/submissao-resumo' },
  ],
};

export const SUBSCRIBER_ADMIN_EXTRA_KEYS = [
  'noticias',
  'multimedia',
  'utilizadores',
  'enviar-email',
  'definicoes',
  'estatisticas',
] as const;

export type SubscriberAdminExtraKey = (typeof SUBSCRIBER_ADMIN_EXTRA_KEYS)[number];

export const STAFF_MENU_HREFS: Record<StaffMenuKey, string> = {
  dashboard: '/dashboard',
  noticias: '/noticias',
  multimedia: '/media',
  resumos: '/documentos-gerais',
  utilizadores: '/utilizadores',
  'enviar-email': '/enviar-email/normal',
  definicoes: '/definicoes',
  estatisticas: '/estatisticas',
};

export type MenuPrivilegesConfig = {
  editor?: Partial<Record<StaffMenuKey, boolean>>;
  editorSub?: Partial<Record<string, boolean>>;
  subscriber?: Partial<Record<SubscriberMenuKey, boolean>>;
  subscriberSub?: Partial<Record<string, boolean>>;
  /** Activa a secção «Opções do administrador» no painel subscritor. */
  subscriberAdminExtrasEnabled?: boolean;
  subscriberAdminExtras?: Partial<Record<SubscriberAdminExtraKey, boolean>>;
  subscriberAdminExtrasSub?: Partial<Record<string, boolean>>;
};

export const STAFF_MENU_LABELS: Record<StaffMenuKey, string> = {
  dashboard: 'Dashboard',
  noticias: 'Notícias',
  multimedia: 'Multimédia',
  resumos: 'Resumos',
  utilizadores: 'Utilizadores',
  'enviar-email': 'Enviar e-mail',
  definicoes: 'Definições',
  estatisticas: 'Estatísticas',
};

export const SUBSCRIBER_MENU_LABELS: Record<SubscriberMenuKey, string> = {
  dashboard: 'Dashboard',
  'minha-conta': 'Minha conta',
  resumos: 'Resumos',
  notificacoes: 'Notificações',
  'definicoes-conta': 'Definições',
};

export function menuSubPrivilegeKey(
  parent: StaffMenuKey | SubscriberMenuKey,
  childKey: string,
): string {
  return `${parent}:${childKey}`;
}

function defaultSubPrivileges(
  items: Partial<Record<string, readonly SubmenuPrivilegeItem[]>>,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [parent, children] of Object.entries(items)) {
    if (!children) continue;
    for (const child of children) {
      out[menuSubPrivilegeKey(parent as StaffMenuKey, child.key)] = true;
    }
  }
  return out;
}

export function defaultMenuPrivileges(): MenuPrivilegesConfig {
  return {
    editor: Object.fromEntries(STAFF_MENU_KEYS.map((k) => [k, true])) as Record<StaffMenuKey, boolean>,
    editorSub: defaultSubPrivileges(STAFF_SUBMENU_ITEMS),
    subscriber: Object.fromEntries(SUBSCRIBER_MENU_KEYS.map((k) => [k, true])) as Record<
      SubscriberMenuKey,
      boolean
    >,
    subscriberSub: defaultSubPrivileges(SUBSCRIBER_SUBMENU_ITEMS),
    subscriberAdminExtrasEnabled: false,
    subscriberAdminExtras: Object.fromEntries(
      SUBSCRIBER_ADMIN_EXTRA_KEYS.map((k) => [k, false]),
    ) as Record<SubscriberAdminExtraKey, boolean>,
    subscriberAdminExtrasSub: defaultSubPrivileges(
      Object.fromEntries(
        SUBSCRIBER_ADMIN_EXTRA_KEYS.filter((k) => STAFF_SUBMENU_ITEMS[k]).map((k) => [
          k,
          STAFF_SUBMENU_ITEMS[k],
        ]),
      ),
    ),
  };
}

export function resolveMenuPrivileges(
  settings: SiteSettingsPayload | null | undefined,
): MenuPrivilegesConfig {
  const defaults = defaultMenuPrivileges();
  const raw = settings?.menuPrivileges;
  if (!raw) return defaults;

  return {
    editor: { ...defaults.editor, ...raw.editor },
    editorSub: { ...defaults.editorSub, ...raw.editorSub },
    subscriber: { ...defaults.subscriber, ...raw.subscriber },
    subscriberSub: { ...defaults.subscriberSub, ...raw.subscriberSub },
    subscriberAdminExtrasEnabled: raw.subscriberAdminExtrasEnabled === true,
    subscriberAdminExtras: { ...defaults.subscriberAdminExtras, ...raw.subscriberAdminExtras },
    subscriberAdminExtrasSub: {
      ...defaults.subscriberAdminExtrasSub,
      ...raw.subscriberAdminExtrasSub,
    },
  };
}

export function isStaffMenuEnabled(
  privileges: MenuPrivilegesConfig,
  key: StaffMenuKey,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  return privileges.editor?.[key] !== false;
}

export function isStaffSubmenuEnabled(
  privileges: MenuPrivilegesConfig,
  parent: StaffMenuKey,
  childKey: string,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (!isStaffMenuEnabled(privileges, parent, isAdmin)) return false;
  return privileges.editorSub?.[menuSubPrivilegeKey(parent, childKey)] !== false;
}

export function isSubscriberMenuEnabled(
  privileges: MenuPrivilegesConfig,
  key: SubscriberMenuKey,
): boolean {
  return privileges.subscriber?.[key] !== false;
}

export function isSubscriberSubmenuEnabled(
  privileges: MenuPrivilegesConfig,
  parent: SubscriberMenuKey,
  childKey: string,
): boolean {
  if (!isSubscriberMenuEnabled(privileges, parent)) return false;
  return privileges.subscriberSub?.[menuSubPrivilegeKey(parent, childKey)] !== false;
}

export function isSubscriberAdminExtrasSectionEnabled(
  privileges: MenuPrivilegesConfig,
): boolean {
  return privileges.subscriberAdminExtrasEnabled === true;
}

export function isSubscriberAdminExtraEnabled(
  privileges: MenuPrivilegesConfig,
  key: SubscriberAdminExtraKey,
): boolean {
  if (!isSubscriberAdminExtrasSectionEnabled(privileges)) return false;
  return privileges.subscriberAdminExtras?.[key] === true;
}

export function isSubscriberAdminExtraSubEnabled(
  privileges: MenuPrivilegesConfig,
  parent: SubscriberAdminExtraKey,
  childKey: string,
): boolean {
  if (!isSubscriberAdminExtraEnabled(privileges, parent)) return false;
  return privileges.subscriberAdminExtrasSub?.[menuSubPrivilegeKey(parent, childKey)] !== false;
}

export function buildStaffSubmenuEntries(
  parent: StaffMenuKey,
  menuBase: string,
  privileges: MenuPrivilegesConfig,
  isAdmin: boolean,
  items?: readonly SubmenuPrivilegeItem[],
): Array<{ label: string; href: string; subKey: string }> {
  const source = items ?? STAFF_SUBMENU_ITEMS[parent] ?? [];
  return source
    .filter((item) => isStaffSubmenuEnabled(privileges, parent, item.key, isAdmin))
    .map((item) => ({
      label: item.label,
      href: `${menuBase}${item.hrefSuffix}`,
      subKey: item.key,
    }));
}

export function buildSubscriberAdminExtraSubmenuEntries(
  parent: SubscriberAdminExtraKey,
  menuBase: string,
  privileges: MenuPrivilegesConfig,
): Array<{ label: string; href: string; subKey: string }> {
  const source = STAFF_SUBMENU_ITEMS[parent] ?? [];
  return source
    .filter((item) => isSubscriberAdminExtraSubEnabled(privileges, parent, item.key))
    .map((item) => ({
      label: item.label,
      href: `${menuBase}${item.hrefSuffix}`,
      subKey: item.key,
    }));
}

function pathMatchesDashboardSuffix(pathname: string, suffix: string): boolean {
  const full = `/dashboard${suffix}`;
  return pathname === full || pathname.startsWith(`${full}/`);
}

export function isStaffDashboardPathAllowed(
  pathname: string,
  privileges: MenuPrivilegesConfig,
  isAdmin: boolean,
  canViewNews: boolean,
  canManageUsers: boolean,
): boolean {
  if (isAdmin) return true;
  if (pathname.startsWith('/dashboard/privilegios')) return false;
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return isStaffMenuEnabled(privileges, 'dashboard', isAdmin);
  }

  for (const key of STAFF_MENU_KEYS) {
    if (key === 'dashboard') continue;
    if (key === 'noticias' && !canViewNews) continue;
    if (key === 'utilizadores' && !canManageUsers) continue;

    const subs = STAFF_SUBMENU_ITEMS[key];
    if (subs?.length) {
      for (const sub of subs) {
        if (pathMatchesDashboardSuffix(pathname, sub.hrefSuffix)) {
          if (!isStaffMenuEnabled(privileges, key, isAdmin)) return false;
          return isStaffSubmenuEnabled(privileges, key, sub.key, isAdmin);
        }
      }
    }

    const href = STAFF_MENU_HREFS[key];
    if (pathMatchesDashboardSuffix(pathname, href)) {
      return isStaffMenuEnabled(privileges, key, isAdmin);
    }
  }

  return true;
}

export function isSubscriberDashboardPathAllowed(
  pathname: string,
  privileges: MenuPrivilegesConfig,
): boolean {
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    return isSubscriberMenuEnabled(privileges, 'dashboard');
  }

  for (const key of SUBSCRIBER_MENU_KEYS) {
    if (key === 'dashboard') continue;
    const subs = SUBSCRIBER_SUBMENU_ITEMS[key];
    if (subs?.length) {
      for (const sub of subs) {
        if (pathMatchesDashboardSuffix(pathname, sub.hrefSuffix)) {
          if (!isSubscriberMenuEnabled(privileges, key)) return false;
          return isSubscriberSubmenuEnabled(privileges, key, sub.key);
        }
      }
    }
  }

  for (const key of SUBSCRIBER_ADMIN_EXTRA_KEYS) {
    if (!isSubscriberAdminExtrasSectionEnabled(privileges)) {
      const subs = STAFF_SUBMENU_ITEMS[key] ?? [];
      for (const sub of subs) {
        if (pathMatchesDashboardSuffix(pathname, sub.hrefSuffix)) return false;
      }
      const href = STAFF_MENU_HREFS[key];
      if (pathMatchesDashboardSuffix(pathname, href)) return false;
      continue;
    }

    const subs = STAFF_SUBMENU_ITEMS[key] ?? [];
    for (const sub of subs) {
      if (pathMatchesDashboardSuffix(pathname, sub.hrefSuffix)) {
        if (!isSubscriberAdminExtraEnabled(privileges, key)) return false;
        return isSubscriberAdminExtraSubEnabled(privileges, key, sub.key);
      }
    }
    const href = STAFF_MENU_HREFS[key];
    if (pathMatchesDashboardSuffix(pathname, href)) {
      return isSubscriberAdminExtraEnabled(privileges, key);
    }
  }

  return true;
}
