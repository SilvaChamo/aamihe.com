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
} from 'lucide-react';
import { clearAdminSecret, getLoggedUsername } from '@/lib/admin-auth';
import { getGravatarUrl } from '@/lib/gravatar';
import { rewriteSupabaseStorageUrl } from '@/lib/supabase-asset-url';
import { useSessionUser } from '@/hooks/useSessionUser';
import { useSubscriberNotifications } from '@/hooks/useSubscriberNotifications';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { resolveUserDisplayName } from '@/lib/user-types';
import { staffDashboardPathToAdmin } from '@/lib/admin-permissions';
import { useAdminBase } from '@/lib/admin-base';
import AdminShellSkeleton from '@/components/Admin/AdminShellSkeleton';
import './AdminShell.css';
import './admin-buttons.css';

interface SubmenuEntry {
  label: string;
  href: string;
}

interface MenuItem {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  label: string;
  submenu?: SubmenuEntry[];
  badge?: number;
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
}: SidebarItemProps) => {
  const isChildActive = !!activeSubHref;
  const [isHovered, setIsHovered] = useState(false);
  const mainClassName = ['sidebar-item-main', active ? 'active' : ''].filter(Boolean).join(' ');

  React.useEffect(() => {
    if (isChildActive && !isOpen && onToggle) onToggle();
  }, [isChildActive, isOpen, onToggle]);

  const linkContent = (
    <>
      <Icon className={`sidebar-icon ${active ? 'active' : ''}`} />
      <span className="sidebar-label-row">
        <span className="sidebar-label">{label}</span>
        {badge != null && badge > 0 ? (
          <span className="sidebar-notify-badge" aria-label={`${badge} notificações por ler`}>
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
      onMouseLeave={() => setIsHovered(false)}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggle) onToggle();
              }}
              className={`sidebar-chevron ${isOpen ? 'open' : ''}`}
            />
          )}
        </div>

        {submenu && isHovered && !isOpen && (
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

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const base = useAdminBase();
  const { user, isAdminSecret, isSubscriber, isStaff, loading: sessionLoading } = useSessionUser();
  const { unread: subscriberUnread } = useSubscriberNotifications();
  const { canManageNews, canManageUsers, canViewNews } = useAdminPermissions();
  const showSubscriberNav = base === '/dashboard' && isSubscriber;
  const menuBase = showSubscriberNav ? '/dashboard' : '/admin';
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
      ? rewriteSupabaseStorageUrl(user.avatar)
      : !sessionLoading && user?.email
        ? getGravatarUrl(user.email, 80)
        : null;

  const showAccountFooter = sessionLoading || !!loggedUserLabel;

  const subscriberPaths = [
    '/dashboard',
    '/dashboard/minha-conta',
    '/dashboard/meus-documentos',
    '/dashboard/notificacoes',
    '/dashboard/definicoes-conta',
    '/dashboard/submissao-resumo',
  ];

  React.useEffect(() => {
    if (sessionLoading) return;

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

    const allowed = subscriberPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (!allowed) {
      router.replace('/dashboard');
    }
  }, [
    pathname,
    router,
    sessionLoading,
    showSubscriberNav,
    isSubscriber,
    isStaff,
    canManageNews,
    canViewNews,
    menuBase,
  ]);

  const handleToggleSubmenu = (label: string) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  React.useEffect(() => {
    if (openSubmenu === 'Multimédia' && !pathname.startsWith(`${menuBase}/media`)) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Notícias' && !pathname.startsWith(`${menuBase}/noticias`)) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Utilizadores' && !pathname.startsWith(`${menuBase}/utilizadores`)) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Definições' && !pathname.startsWith(`${menuBase}/definicoes`)) {
      setOpenSubmenu(null);
    }
  }, [pathname, openSubmenu, menuBase]);

  const newsSubmenu: SubmenuEntry[] = canManageNews
    ? [
        { label: 'Todas as Notícias', href: `${menuBase}/noticias` },
        { label: 'Adicionar Nova', href: `${menuBase}/noticias/nova` },
        { label: 'Categorias', href: `${menuBase}/noticias/categorias` },
        { label: 'Etiquetas', href: `${menuBase}/noticias/etiquetas` },
      ]
    : canViewNews
      ? [{ label: 'Todas as Notícias', href: `${menuBase}/noticias` }]
      : [];

  const menuItems: MenuItem[] = showSubscriberNav
    ? [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/minha-conta', icon: UserCircle, label: 'Minha conta' },
        { href: '/dashboard/meus-documentos', icon: FileUp, label: 'Resumos' },
        {
          href: '/dashboard/notificacoes',
          icon: Bell,
          label: 'Notificações',
          badge: subscriberUnread,
        },
        { href: '/dashboard/definicoes-conta', icon: Settings, label: 'Definições' },
      ]
    : [
        {
          href: `${menuBase}/dashboard`,
          icon: LayoutDashboard,
          label: 'Dashboard',
        },
    ...(canViewNews
      ? [
          {
            href: `${menuBase}/noticias`,
            icon: Newspaper,
            label: 'Notícias',
            submenu: newsSubmenu,
          },
        ]
      : []),
    {
      href: `${menuBase}/media`,
      icon: ImageIcon,
      label: 'Multimédia',
      submenu: [
        { label: 'Biblioteca', href: `${menuBase}/media` },
        { label: 'Documentos', href: `${menuBase}/media/documentos` },
        { label: 'Vídeos', href: `${menuBase}/media/videos` },
      ],
    },
    {
      href: `${menuBase}/documentos-gerais`,
      icon: FileUp,
      label: 'Resumos',
    },
    ...(canManageUsers
      ? [
          {
            href: `${menuBase}/utilizadores`,
            icon: Users,
            label: 'Utilizadores',
            submenu: [
              { label: 'Todos os Utilizadores', href: `${menuBase}/utilizadores` },
              { label: 'Subscritores Conferência', href: `${menuBase}/utilizadores/subscritores` },
              { label: 'Adicionar Novo', href: `${menuBase}/utilizadores/novo` },
            ],
          },
        ]
      : []),
    {
      href: `${menuBase}/enviar-email/normal`,
      icon: Mail,
      label: 'Enviar e-mail',
    },
    {
      href: `${menuBase}/definicoes`,
      icon: Settings,
      label: 'Definições',
      submenu: [
        { label: 'Configurações do Site', href: `${menuBase}/definicoes` },
        { label: 'Notícias', href: `${menuBase}/definicoes/noticias` },
        { label: 'Utilizadores', href: `${menuBase}/definicoes/utilizadores` },
        { label: 'Media', href: `${menuBase}/definicoes/media` },
        { label: 'Segurança', href: `${menuBase}/definicoes/seguranca` },
        { label: 'Backup', href: `${menuBase}/definicoes/backup` },
        { label: 'API & Integrações', href: `${menuBase}/definicoes/api` },
      ],
    },
    {
      href: `${menuBase}/estatisticas`,
      icon: ChartColumnIncreasing,
      label: 'Estatísticas',
    },
  ];

  const handleLogout = () => {
    clearAdminSecret();
    router.push('/dashboard/login');
  };

  if (sessionLoading && !user) {
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
          <span className="admin-brand-title">AAMIHE</span>
        </div>
        <div className="admin-brand-right">
          <Link href="/" target="_blank" className="admin-brand-action">
            <ExternalLink className="admin-brand-action-icon" />
            Ver Site
          </Link>
          <button type="button" onClick={handleLogout} className="admin-brand-action">
            <LogOut className="admin-brand-action-icon" />
            Sair
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
              const shouldBeOpen = openSubmenu === item.label || isChildActive;

              return (
                <SidebarItem
                  key={item.href || item.label}
                  href={item.href}
                  onClick={item.onClick}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
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

          <div className="admin-main-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
