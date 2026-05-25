'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  ImageIcon,
  Settings,
  Plus,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  FileUp,
  Video,
} from 'lucide-react';
import './AdminShell.css';

interface SubmenuEntry {
  label: string;
  href: string;
}

function routeMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  submenu?: SubmenuEntry[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const SidebarItem = ({ href, icon: Icon, label, active, submenu, isOpen = false, onToggle }: SidebarItemProps) => {
  const pathname = usePathname();
  const isChildActive =
    submenu?.some((item) => routeMatches(pathname, item.href)) ?? false;
  const [isHovered, setIsHovered] = useState(false);
  const isDashboard = label === 'Dashboard';

  // Expand if child becomes active
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
        {isDashboard ? (
          <div className={`sidebar-item-main ${active ? 'active' : ''}`}>
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
        ) : (
          <div className={`sidebar-item-main ${active ? 'active' : ''}`}>
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
        )}

        {/* Hover Flyout Submenu */}
        {submenu && isHovered && !isOpen && (
          <div className="sidebar-flyout">
            <div className="sidebar-flyout-title">
              {label}
            </div>
            {submenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-flyout-item ${routeMatches(pathname, item.href) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Inline Expanded Submenu */}
      {submenu && isOpen && (
        <div className="sidebar-submenu">
          {submenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-submenu-item ${routeMatches(pathname, item.href) ? 'active' : ''}`}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleToggleSubmenu = (label: string) => {
    setOpenSubmenu(prev => prev === label ? null : label);
  };

  // Fechar submenu quando navegar para página fora do multimídia
  React.useEffect(() => {
    if (openSubmenu === 'Multimédia' && !pathname.startsWith('/admin/media')) {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'Notícias' && !pathname.startsWith('/admin/noticias')) {
      setOpenSubmenu(null);
    }
  }, [pathname, openSubmenu]);

  const menuItems = [
    {
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    { 
      href: '/admin/noticias', 
      icon: Newspaper, 
      label: 'Notícias',
      submenu: [
        { label: 'Todas as Notícias', href: '/admin/noticias' },
        { label: 'Adicionar Nova', href: '/admin/noticias/nova' },
        { label: 'Categorias', href: '/admin/noticias/categorias' },
        { label: 'Etiquetas', href: '/admin/noticias/etiquetas' },
      ]
    },
    { 
      href: '/admin/media', 
      icon: ImageIcon, 
      label: 'Multimédia',
      submenu: [
        { label: 'Biblioteca', href: '/admin/media' },
        { label: 'Adicionar novo', href: '/admin/media/novo' },
        { label: 'Galeria', href: '/admin/media/galeria' },
        { label: 'Vídeos', href: '/admin/media/videos' },
      ]
    },
    { 
      href: '/admin/documentos-gerais', 
      icon: FileUp, 
      label: 'Documentos',
    },
    { 
      href: '/admin/definicoes', 
      icon: Settings, 
      label: 'Definições',
      submenu: [
        { label: 'Geral', href: '/admin/definicoes' },
        { label: 'Notícias', href: '/admin/definicoes/noticias' },
        { label: 'Media', href: '/admin/definicoes/media' },
      ]
    },
  ];

  return (
    <div className="admin-shell">
      {/* Barra superior castanha AAMIHE */}
      <header className="admin-bar">
        <div className="admin-bar-left">
          <Link href="/" className="admin-bar-logo">
            <Settings className="admin-bar-logo-icon" />
            <span className="admin-bar-logo-text">AAMIHE</span>
          </Link>
          
          <div className="admin-bar-links">
            <Link href="/admin/noticias/nova" className="admin-bar-link">
              <Plus className="admin-bar-link-icon" />
              <span>Novo</span>
            </Link>
            <Link href="/" target="_blank" className="admin-bar-link">
              <ExternalLink className="admin-bar-link-icon" />
              <span>Ver Site</span>
            </Link>
          </div>
        </div>

        <div className="admin-bar-right">
          <span className="admin-bar-user">
            Administrador
          </span>
        </div>
      </header>

      <div className="admin-content-wrapper">
        {/* Sidebar (Menu Lateral) */}
        <aside 
          className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
        >
          <nav className="admin-sidebar-nav">
            {menuItems.map((item) => {
              const subs = item.submenu;
              const isChildActive =
                subs?.some((sub) => routeMatches(pathname, sub.href)) ?? false;
              const isParentActive = pathname === item.href;
              const isActive = isParentActive || isChildActive;
              const shouldBeOpen = openSubmenu === item.label || isChildActive;
              
              return (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  submenu={item.submenu}
                  active={isActive}
                  isOpen={shouldBeOpen}
                  onToggle={() => handleToggleSubmenu(item.label)}
                />
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="sidebar-toggle"
          >
            {isSidebarOpen ? <X className="sidebar-toggle-icon" /> : <Menu className="sidebar-toggle-icon" />}
          </button>

          <div className="admin-main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
