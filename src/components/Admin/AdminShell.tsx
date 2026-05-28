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
} from 'lucide-react';
import { clearAdminSecret } from '@/lib/admin-auth';
import { useAdminBase } from '@/lib/admin-base';
import './AdminShell.css';

interface SubmenuEntry {
  label: string;
  href: string;
}

function getActiveSubmenuHref(pathname: string, submenu: SubmenuEntry[]): string | null {
  const matches = submenu
    .filter((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length);
  return matches[0]?.href ?? null;
}

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  activeSubHref?: string | null;
  submenu?: SubmenuEntry[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const SidebarItem = ({
  href,
  icon: Icon,
  label,
  active,
  activeSubHref = null,
  submenu,
  isOpen = false,
  onToggle,
}: SidebarItemProps) => {
  const isChildActive = !!activeSubHref;
  const [isHovered, setIsHovered] = useState(false);
  const isDashboard = label === 'Dashboard';
  const mainClassName = ['sidebar-item-main', active ? 'active' : ''].filter(Boolean).join(' ');

  React.useEffect(() => {
    if (isChildActive && !isOpen && onToggle) onToggle();
  }, [isChildActive, isOpen, onToggle]);

  return (
    <div
      className="sidebar-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar-item-content">
        <div className={mainClassName}>
          <Link href={href} className="sidebar-item-link">
            <Icon className={`sidebar-icon ${active ? 'active' : ''}`} />
            <span className="sidebar-label">{label}</span>
          </Link>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleToggleSubmenu = (label: string) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  React.useEffect(() => {
    if (openSubmenu === 'Multimédia' && !pathname.startsWith(`${base}/media`)) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Notícias' && !pathname.startsWith(`${base}/noticias`)) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Utilizadores' && !pathname.startsWith(`${base}/utilizadores`)) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Definições' && !pathname.startsWith(`${base}/definicoes`)) {
      setOpenSubmenu(null);
    }
  }, [pathname, openSubmenu, base]);

  const menuItems = [
    {
      href: base === '/dashboard' ? '/dashboard' : '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      href: `${base}/noticias`,
      icon: Newspaper,
      label: 'Notícias',
      submenu: [
        { label: 'Todas as Notícias', href: `${base}/noticias` },
        { label: 'Adicionar Nova', href: `${base}/noticias/nova` },
        { label: 'Categorias', href: `${base}/noticias/categorias` },
        { label: 'Etiquetas', href: `${base}/noticias/etiquetas` },
      ],
    },
    {
      href: `${base}/media`,
      icon: ImageIcon,
      label: 'Multimédia',
      submenu: [
        { label: 'Biblioteca', href: `${base}/media` },
        ...(base === '/dashboard'
          ? [{ label: 'Documentos', href: `${base}/media/documentos` }]
          : [
              { label: 'Adicionar novo', href: `${base}/media/novo` },
              { label: 'Galeria', href: `${base}/media/galeria` },
            ]),
        { label: 'Vídeos', href: `${base}/media/videos` },
      ],
    },
    {
      href: `${base}/documentos-gerais`,
      icon: FileUp,
      label: 'Documentos',
    },
    {
      href: `${base}/utilizadores`,
      icon: Users,
      label: 'Utilizadores',
      submenu: [
        { label: 'Todos os Utilizadores', href: `${base}/utilizadores` },
        { label: 'Subscritores Conferência', href: `${base}/utilizadores/subscritores` },
        { label: 'Adicionar Novo', href: `${base}/utilizadores/novo` },
      ],
    },
    {
      href: `${base}/definicoes`,
      icon: Settings,
      label: 'Definições',
      submenu: [
        { label: 'Configurações do Site', href: `${base}/definicoes` },
        { label: 'Notícias', href: `${base}/definicoes/noticias` },
        { label: 'Utilizadores', href: `${base}/definicoes/utilizadores` },
        { label: 'Media', href: `${base}/definicoes/media` },
        { label: 'Segurança', href: `${base}/definicoes/seguranca` },
        { label: 'Backup', href: `${base}/definicoes/backup` },
        { label: 'API & Integrações', href: `${base}/definicoes/api` },
      ],
    },
    {
      href: `${base}/estatisticas`,
      icon: ChartColumnIncreasing,
      label: 'Estatísticas',
    },
  ];

  const handleLogout = () => {
    clearAdminSecret();
    router.push('/admin/login');
  };

  const homeHref = base === '/dashboard' ? '/dashboard' : '/admin/dashboard';

  return (
    <div className="admin-shell">
      <header className="admin-brand-bar">
        <div className="admin-brand-left">
          <Link href={homeHref} className="admin-brand-logo">
            AAMIHE
          </Link>
          <Link href="/" target="_blank" className="admin-brand-action">
            <ExternalLink className="admin-brand-action-icon" />
            Ver Site
          </Link>
        </div>
        <div className="admin-brand-right">
          <span className="admin-brand-tagline">Painel de administração</span>
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
              const isActive = hasSubmenu
                ? isChildActive || pathname === item.href
                : pathname === item.href;
              const shouldBeOpen = openSubmenu === item.label || isChildActive;

              return (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  submenu={item.submenu}
                  active={isActive}
                  activeSubHref={activeSubHref}
                  isOpen={shouldBeOpen}
                  onToggle={() => handleToggleSubmenu(item.label)}
                />
              );
            })}
          </nav>
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
