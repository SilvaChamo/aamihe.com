'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  ImageIcon,
  Settings,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  FileUp,
  Video,
  LogOut,
  Users,
  ChartColumnIncreasing,
  UserCircle,
  Bell,
  Mail,
  Shield,
} from 'lucide-react';
import { clearAdminSecret, getLoggedUsername, getSessionProfile } from '@/lib/admin-auth';
import { getGravatarUrl } from '@/lib/gravatar';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import { useSessionUser } from '@/hooks/useSessionUser';
import { useSubscriberNotifications } from '@/hooks/useSubscriberNotifications';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useMenuPrivileges } from '@/hooks/useMenuPrivileges';
import { peekCachedSettings } from '@/lib/settings-cache';
import {
  buildStaffSubmenuEntries,
  buildSubscriberAdminExtraSubmenuEntries,
  isStaffDashboardPathAllowed,
  isStaffMenuEnabled,
  isSubscriberAdminExtraEnabled,
  isSubscriberDashboardPathAllowed,
  isSubscriberMenuEnabled,
  STAFF_MENU_HREFS,
  STAFF_SUBMENU_ITEMS,
  SUBSCRIBER_ADMIN_EXTRA_KEYS,
  type StaffMenuKey,
  type SubscriberAdminExtraKey,
  type SubscriberMenuKey,
} from '@/lib/menu-privileges';
import { resolveUserDisplayName } from '@/lib/user-types';
import { staffDashboardPathToAdmin } from '@/lib/admin-permissions';
import { useAdminBase } from '@/lib/admin-base';
import { useLanguage } from '@/context/LanguageContext';
import { adminShellCopy, tMessages } from '@/i18n/messages';
import AdminShellSkeleton from '@/components/Admin/AdminShellSkeleton';
import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import './AdminShell.css';
import './admin-buttons.css';

interface SubmenuEntry {
  label: string;
  href: string;
  subKey?: string;
}

interface MenuItem {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  label: string;
  menuKey?: StaffMenuKey | SubscriberMenuKey;
  submenu?: SubmenuEntry[];
  badge?: number;
  badgeLabel?: string;
  badgeAriaLabel?: string;
}

function getActiveSubmenuHref(pathname: string, submenu: SubmenuEntry[]): string | null {
  const matches = submenu
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? null;
}

interface SidebarItemProps {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  activeSubHref?: string | null;
  submenu?: SubmenuEntry[];
  isOpen?: boolean;
  onToggle?: () => void;
  badge?: number;
  badgeLabel?: string;
  badgeAriaLabel?: string;
}

const SidebarItem = ({
  href,
  onClick,
  icon: Icon,
  label,
  active,
  activeSubHref = null,
  submenu,
  isOpen = false,
  onToggle,
  badge = 0,
  badgeLabel,
  badgeAriaLabel,
}: SidebarItemProps) => {
  const isChildActive = !!activeSubHref;
  const [isHovered, setIsHovered] = useState(false);
  const suppressFlyoutRef = React.useRef(false);
  const mainClassName = ['sidebar-item-main', active ? 'active' : ''].filter(Boolean).join(' ');

  const handleChevronToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    suppressFlyoutRef.current = true;
    onToggle?.();
  };

  const linkContent = (
    <>
      <Icon className={`sidebar-icon ${active ? 'active' : ''}`} />
      <span className="sidebar-label-row">
        <span className="sidebar-label">{label}</span>
        {badgeLabel ? (
          <span className="sidebar-new-badge">{badgeLabel}</span>
        ) : badge != null && badge > 0 ? (
          <span className="sidebar-notify-badge" aria-label={badgeAriaLabel || `${badge}`}>
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <div
      className="sidebar-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        suppressFlyoutRef.current = false;
      }}
    >
      <div className="sidebar-item-content">
        <div className={mainClassName}>
          {onClick ? (
            <button type="button" className="sidebar-item-link sidebar-item-button" onClick={onClick}>
              {linkContent}
            </button>
          ) : (
            <Link href={href || '#'} className="sidebar-item-link">
              {linkContent}
            </Link>
          )}
          {submenu && (
            <ChevronDown
              onClick={handleChevronToggle}
              className={`sidebar-chevron ${isOpen ? 'open' : ''}`}
            />
          )}
        </div>

        {submenu && isHovered && !isOpen && !suppressFlyoutRef.current && (
          <div className="sidebar-flyout">
            <div className="sidebar-flyout-title">{label}</div>
            {submenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-flyout-item ${activeSubHref === item.href ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {submenu && isOpen && (
        <div className="sidebar-submenu">
          {submenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-submenu-item ${activeSubHref === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

function staffMenuIcon(key: StaffMenuKey): React.ElementType {
  const icons: Record<StaffMenuKey, React.ElementType> = {
    dashboard: LayoutDashboard,
    noticias: Newspaper,
    multimedia: ImageIcon,
    resumos: FileUp,
    utilizadores: Users,
    'enviar-email': Mail,
    definicoes: Settings,
    estatisticas: ChartColumnIncreasing,
  };
  return icons[key];
}

function resolvePanelRoleLabel(
  sessionLoading: boolean,
  user: ReturnType<typeof useSessionUser>['user'],
  isAdminSecret: boolean,
  isSubscriber: boolean,
  isAdmin: boolean,
  roles: { administrator: string; subscriber: string; author: string },
): string {
  if (sessionLoading) return '';
  if (isAdminSecret || isAdmin || user?.role === 'Administrador') return roles.administrator;
  if (isSubscriber || user?.role === 'Subscritor') return roles.subscriber;
  return roles.author;
}

const STAFF_MENU_I18N: Record<StaffMenuKey, keyof typeof adminShellCopy.pt.menu> = {
  dashboard: 'dashboard',
  noticias: 'noticias',
  multimedia: 'multimedia',
  resumos: 'resumos',
  utilizadores: 'utilizadores',
  'enviar-email': 'enviarEmail',
  definicoes: 'definicoes',
  estatisticas: 'estatisticas',
};

const SUBSCRIBER_MENU_I18N: Record<SubscriberMenuKey, keyof typeof adminShellCopy.pt.menu> = {
  dashboard: 'dashboard',
  'minha-conta': 'minhaConta',
  resumos: 'resumos',
  notificacoes: 'notificacoes',
  'definicoes-conta': 'definicoesConta',
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = useAdminBase();
  const { locale } = useLanguage();
  const shell = tMessages(adminShellCopy, locale);
  const { user, isAdminSecret, isSubscriber, isStaff, loading: sessionLoading } = useSessionUser();
  const sessionProfile = user ?? getSessionProfile();
  const { unread: subscriberUnread } = useSubscriberNotifications();
  const { canManageNews, canManageUsers, canViewNews, isAdmin } = useAdminPermissions();
  const { privileges, loading: privilegesLoading } = useMenuPrivileges();
  const showSubscriberNav = base === '/dashboard' && isSubscriber;
  const menuBase = '/dashboard';
  const hasCachedPrivileges = Boolean(peekCachedSettings());
  const privilegesReady = isAdmin || !privilegesLoading || hasCachedPrivileges;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const loggedUserLabel = sessionLoading
    ? '…'
    : user
      ? resolveUserDisplayName(user)
      : isAdminSecret
        ? getLoggedUsername() || 'Administrador'
        : '';

  const accountEmail = sessionLoading ? '…' : user?.email || '';

  const accountAvatar =
    !sessionLoading && user?.avatar
      ? resolveAvatarUrl(user.avatar)
      : !sessionLoading && user?.email
        ? getGravatarUrl(user.email, 80)
        : null;

  const showAccountFooter = sessionLoading || !!loggedUserLabel;
  const panelRoleLabel = resolvePanelRoleLabel(
    sessionLoading,
    user,
    isAdminSecret,
    isSubscriber,
    isAdmin,
    {
      administrator: shell.administrator,
      subscriber: shell.subscriber,
      author: shell.author,
    },
  );

  const translateSubmenu = (entries: SubmenuEntry[]): SubmenuEntry[] =>
    entries.map((entry) => ({
      ...entry,
      label:
        entry.subKey && entry.subKey in shell.submenu
          ? shell.submenu[entry.subKey as keyof typeof shell.submenu]
          : entry.label,
    }));

  const staffMenuLabel = (key: StaffMenuKey) => shell.menu[STAFF_MENU_I18N[key]];
  const subscriberMenuLabel = (key: SubscriberMenuKey) => shell.menu[SUBSCRIBER_MENU_I18N[key]];

  const dashboardPathAllowed = React.useMemo(() => {
    if (sessionLoading || !privilegesReady) return true;

    if (isSubscriber && pathname.startsWith('/admin')) return false;

    if (isStaff && !isSubscriber) {
      if (staffDashboardPathToAdmin(pathname)) return false;
      if (
        !isStaffDashboardPathAllowed(
          pathname,
          privileges,
          isAdmin,
          canViewNews,
          canManageUsers,
        )
      ) {
        return false;
      }
    }

    if (!canManageNews && canViewNews) {
      const blocked =
        pathname.includes('/noticias/nova') ||
        pathname.includes('/noticias/editar') ||
        pathname.includes('/noticias/categorias') ||
        pathname.includes('/noticias/etiquetas');
      if (blocked) return false;
    }

    if (showSubscriberNav && !isSubscriberDashboardPathAllowed(pathname, privileges)) {
      return false;
    }

    return true;
  }, [
    sessionLoading,
    privilegesReady,
    isSubscriber,
    pathname,
    isStaff,
    privileges,
    isAdmin,
    canViewNews,
    canManageUsers,
    canManageNews,
    showSubscriberNav,
  ]);

  React.useEffect(() => {
    if (sessionLoading || !privilegesReady) return;

    if (isSubscriber && pathname.startsWith('/admin')) {
      router.replace('/dashboard');
      return;
    }

    if (isStaff && !isSubscriber) {
      const adminPath = staffDashboardPathToAdmin(pathname);
      if (adminPath) {
        router.replace(adminPath);
        return;
      }

      if (
        !isStaffDashboardPathAllowed(
          pathname,
          privileges,
          isAdmin,
          canViewNews,
          canManageUsers,
        )
      ) {
        router.replace('/dashboard');
        return;
      }
    }

    if (!canManageNews && canViewNews) {
      const blocked =
        pathname.includes('/noticias/nova') ||
        pathname.includes('/noticias/editar') ||
        pathname.includes('/noticias/categorias') ||
        pathname.includes('/noticias/etiquetas');
      if (blocked) {
        router.replace(`${menuBase}/noticias`);
      }
    }

    if (!showSubscriberNav) return;

    if (!isSubscriberDashboardPathAllowed(pathname, privileges)) {
      router.replace('/dashboard');
    }
  }, [
    pathname,
    router,
    sessionLoading,
    privilegesReady,
    privileges,
    showSubscriberNav,
    isSubscriber,
    isStaff,
    isAdmin,
    canManageNews,
    canViewNews,
    canManageUsers,
    menuBase,
  ]);

  const handleToggleSubmenu = (label: string) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  const newsSubmenuItems = canManageNews
    ? STAFF_SUBMENU_ITEMS.noticias
    : canViewNews
      ? STAFF_SUBMENU_ITEMS.noticias?.filter((item) => item.key === 'list')
      : undefined;

  const newsSubmenu: SubmenuEntry[] = newsSubmenuItems
    ? translateSubmenu(
        buildStaffSubmenuEntries('noticias', menuBase, privileges, isAdmin, newsSubmenuItems),
      )
    : [];

  const multimediaSubmenu = translateSubmenu(
    buildStaffSubmenuEntries('multimedia', menuBase, privileges, isAdmin),
  );

  const utilizadoresSubmenu = translateSubmenu(
    buildStaffSubmenuEntries('utilizadores', menuBase, privileges, isAdmin),
  );

  const definicoesSubmenu = translateSubmenu(
    buildStaffSubmenuEntries('definicoes', menuBase, privileges, isAdmin),
  );

  const subscriberExtraItems: MenuItem[] = SUBSCRIBER_ADMIN_EXTRA_KEYS.filter((key) =>
    isSubscriberAdminExtraEnabled(privileges, key),
  ).map((key) => {
    const submenu = buildSubscriberAdminExtraSubmenuEntries(key, menuBase, privileges);
    return {
      href: `${menuBase}${STAFF_MENU_HREFS[key]}`,
      icon: staffMenuIcon(key),
      label: staffMenuLabel(key),
      badgeLabel: shell.badgeNew,
      ...(submenu.length ? { submenu: translateSubmenu(submenu) } : {}),
    };
  });

  const subscriberBaseItems: MenuItem[] = [
    { href: '/dashboard', icon: LayoutDashboard, label: subscriberMenuLabel('dashboard'), menuKey: 'dashboard' as SubscriberMenuKey },
    { href: '/dashboard/minha-conta', icon: UserCircle, label: subscriberMenuLabel('minha-conta'), menuKey: 'minha-conta' as SubscriberMenuKey },
    { href: '/dashboard/meus-documentos', icon: FileUp, label: subscriberMenuLabel('resumos'), menuKey: 'resumos' as SubscriberMenuKey },
    {
      href: '/dashboard/notificacoes',
      icon: Bell,
      label: subscriberMenuLabel('notificacoes'),
      menuKey: 'notificacoes' as SubscriberMenuKey,
      badge: subscriberUnread,
      badgeAriaLabel: shell.notificationsUnread(subscriberUnread),
    },
    {
      href: '/dashboard/definicoes-conta',
      icon: Settings,
      label: subscriberMenuLabel('definicoes-conta'),
      menuKey: 'definicoes-conta' as SubscriberMenuKey,
    },
  ].filter((item) =>
    item.menuKey ? isSubscriberMenuEnabled(privileges, item.menuKey as SubscriberMenuKey) : true,
  );

  const menuItems: MenuItem[] = showSubscriberNav
    ? [...subscriberBaseItems, ...subscriberExtraItems]
    : [
        {
          href: menuBase,
          icon: LayoutDashboard,
          label: staffMenuLabel('dashboard'),
          menuKey: 'dashboard' as StaffMenuKey,
        },
        ...(canViewNews
          ? [
              {
                href: `${menuBase}/noticias`,
                icon: Newspaper,
                label: staffMenuLabel('noticias'),
                menuKey: 'noticias' as StaffMenuKey,
                ...(newsSubmenu.length ? { submenu: newsSubmenu } : {}),
              },
            ]
          : []),
        {
          href: `${menuBase}/media`,
          icon: ImageIcon,
          label: staffMenuLabel('multimedia'),
          menuKey: 'multimedia' as StaffMenuKey,
          ...(multimediaSubmenu.length ? { submenu: multimediaSubmenu } : {}),
        },
        {
          href: `${menuBase}/documentos-gerais`,
          icon: FileUp,
          label: staffMenuLabel('resumos'),
          menuKey: 'resumos' as StaffMenuKey,
        },
        ...(canManageUsers
          ? [
              {
                href: `${menuBase}/utilizadores`,
                icon: Users,
                label: staffMenuLabel('utilizadores'),
                menuKey: 'utilizadores' as StaffMenuKey,
                ...(utilizadoresSubmenu.length ? { submenu: utilizadoresSubmenu } : {}),
              },
            ]
          : []),
        {
          href: `${menuBase}/enviar-email/normal`,
          icon: Mail,
          label: staffMenuLabel('enviar-email'),
          menuKey: 'enviar-email' as StaffMenuKey,
        },
        {
          href: `${menuBase}/definicoes`,
          icon: Settings,
          label: staffMenuLabel('definicoes'),
          menuKey: 'definicoes' as StaffMenuKey,
          ...(definicoesSubmenu.length ? { submenu: definicoesSubmenu } : {}),
        },
        {
          href: `${menuBase}/estatisticas`,
          icon: ChartColumnIncreasing,
          label: staffMenuLabel('estatisticas'),
          menuKey: 'estatisticas' as StaffMenuKey,
        },
        ...(isAdmin
          ? [
              {
                href: `${menuBase}/privilegios`,
                icon: Shield,
                label: shell.menu.privilegios,
              } as MenuItem,
            ]
          : []),
      ].filter((item) =>
        item.menuKey
          ? isStaffMenuEnabled(privileges, item.menuKey as StaffMenuKey, isAdmin)
          : true,
      );

  React.useEffect(() => {
    if (!privilegesReady) return;

    for (const item of menuItems) {
      if (item.submenu?.length && getActiveSubmenuHref(pathname, item.submenu)) {
        setOpenSubmenu(item.label);
        return;
      }
    }
    setOpenSubmenu(null);
  }, [pathname, privilegesReady]);

  const handleLogout = () => {
    clearAdminSecret();
    router.push('/dashboard/login');
  };

  if ((sessionLoading && !sessionProfile) || !privilegesReady) {
    return (
      <AdminShellSkeleton
        variant={pathname.endsWith('/dashboard') ? 'dashboard' : 'default'}
      />
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-brand-bar">
        <div className="admin-brand-left">
          <span className="admin-brand-title">
            {panelRoleLabel ? `AAMIHE — ${panelRoleLabel}` : 'AAMIHE'}
          </span>
        </div>
        <div className="admin-brand-right">
          <Link href="/" target="_blank" className="admin-brand-action">
            <ExternalLink className="admin-brand-action-icon" />
            {shell.viewSite}
          </Link>
          <button type="button" onClick={handleLogout} className="admin-brand-action">
            <LogOut className="admin-brand-action-icon" />
            {shell.logout}
          </button>
        </div>
      </header>

      <div className="admin-content-wrapper">
        <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <nav className="admin-sidebar-nav">
            {menuItems.map((item) => {
              const subs = item.submenu;
              const activeSubHref = subs ? getActiveSubmenuHref(pathname, subs) : null;
              const isChildActive = !!activeSubHref;
              const hasSubmenu = !!subs?.length;
              const isActive = item.onClick
                ? false
                : hasSubmenu
                  ? isChildActive || pathname === item.href
                  : item.href?.includes('/enviar-email')
                    ? pathname.includes('/enviar-email')
                    : pathname === item.href;
              const shouldBeOpen = openSubmenu === item.label;

              return (
                <SidebarItem
                  key={item.href || item.label}
                  href={item.href}
                  onClick={item.onClick}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  badgeLabel={item.badgeLabel}
                  badgeAriaLabel={item.badgeAriaLabel}
                  submenu={item.submenu}
                  active={isActive}
                  activeSubHref={activeSubHref}
                  isOpen={shouldBeOpen}
                  onToggle={() => handleToggleSubmenu(item.label)}
                />
              );
            })}
          </nav>
          {showAccountFooter ? (
            <div className="admin-sidebar-account">
              <div className="admin-sidebar-account-avatar" aria-hidden>
                {accountAvatar ? (
                  <img src={accountAvatar} alt="" className="admin-sidebar-account-avatar-img" />
                ) : (
                  <UserCircle className="admin-sidebar-account-avatar-icon" />
                )}
              </div>
              <div className="admin-sidebar-account-details">
                <span className="admin-sidebar-account-name">{loggedUserLabel}</span>
                {accountEmail ? (
                  <span className="admin-sidebar-account-email">{accountEmail}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="admin-main">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="sidebar-toggle"
          >
            {isSidebarOpen ? (
              <X className="sidebar-toggle-icon" />
            ) : (
              <Menu className="sidebar-toggle-icon" />
            )}
          </button>

          <div className="admin-main-content">
            {dashboardPathAllowed ? children : <AdminPanelLoading />}
          </div>
        </main>
      </div>
    </div>
  );
}
