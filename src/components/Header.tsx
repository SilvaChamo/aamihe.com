'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import './Header.css';

const SCROLL_PIN_Y = 96;
const SCROLL_UNPIN_Y = 48;
const HEADER_HEIGHT_FULL = '116px';
const HEADER_HEIGHT_NAV = '72px';

const translations = {
  pt: {
    inicio: 'INÍCIO',
    sobre: 'SOBRE-NÓS',
    servicos: 'SERVIÇOS',
    conferencia: 'CONFERÊNCIA',
    blog: 'BLOG',
    contacto: 'CONTACTE-NOS',
    entrar: 'ENTRAR',
  },
  fr: {
    inicio: 'ACCUEIL',
    sobre: 'À PROPOS',
    servicos: 'SERVICES',
    conferencia: 'CONFÉRENCE',
    blog: 'BLOG',
    contacto: 'CONTACTEZ-NOUS',
    entrar: 'SE CONNECTER',
  },
  en: {
    inicio: 'HOME',
    sobre: 'ABOUT US',
    servicos: 'SERVICES',
    conferencia: 'CONFERENCE',
    blog: 'BLOG',
    contacto: 'CONTACT US',
    entrar: 'SIGN IN',
  },
} as const;

export default function Header() {
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const [navPinned, setNavPinned] = useState(false);

  const t = translations[locale];

  useEffect(() => {
    const syncPinned = (y: number) => {
      setNavPinned((pinned) => {
        if (!pinned && y > SCROLL_PIN_Y) return true;
        if (pinned && y < SCROLL_UNPIN_Y) return false;
        return pinned;
      });
    };

    syncPinned(window.scrollY);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        syncPinned(window.scrollY);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--site-header-height',
      navPinned ? HEADER_HEIGHT_NAV : HEADER_HEIGHT_FULL,
    );
    return () => {
      document.documentElement.style.setProperty('--site-header-height', HEADER_HEIGHT_FULL);
    };
  }, [navPinned]);

  return (
    <header className={`header${navPinned ? ' header--nav-pinned' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container top-bar-container">
          <div className="contact-info">
            <span className="contact-item">
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg>
              Rua da Sé nº 114, Pestana Rovuma Hotel
            </span>

            <span className="contact-item">
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg>
              geral@aamihe.com
            </span>
          </div>
          <div className="top-bar-right">
            <ul className="elementor-nav-menu">
              <li className={`trp-language-switcher-container ${locale === 'pt' ? 'current-language-menu-item' : ''}`}>
                <button onClick={() => setLocale('pt')} className="elementor-item-btn">
                  <img className="trp-flag-image" src="/pt_PT.png" width="18" height="12" alt="PT" />
                  <span className="trp-ls-language-name">PT</span>
                </button>
              </li>
              <li className={`trp-language-switcher-container ${locale === 'fr' ? 'current-language-menu-item' : ''}`}>
                <button onClick={() => setLocale('fr')} className="elementor-item-btn">
                  <img className="trp-flag-image" src="/fr_FR.png" width="18" height="12" alt="FR" />
                  <span className="trp-ls-language-name">FR</span>
                </button>
              </li>
              <li className={`trp-language-switcher-container ${locale === 'en' ? 'current-language-menu-item' : ''}`}>
                <button onClick={() => setLocale('en')} className="elementor-item-btn">
                  <img className="trp-flag-image" src="/en_GB.png" width="18" height="12" alt="EN" />
                  <span className="trp-ls-language-name">EN</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Main Nav */}
      <div className="main-nav">
        <div className="container main-nav-container">
          <Link href="/" className="logo">
            <Image
              src="/Logo-Small.png.webp"
              alt="AAMIHE Logo"
              width={150}
              height={42}
              className="logo-image"
              priority
            />
          </Link>
          
          <nav className="nav">
            <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>{t.inicio}</Link>
            <Link href="/sobre-nos" className={`nav-link ${pathname === '/sobre-nos' ? 'active' : ''}`}>{t.sobre}</Link>
            <Link href="/servicos" className={`nav-link ${pathname === '/servicos' ? 'active' : ''}`}>{t.servicos}</Link>
            <Link href="/conferencia" className={`nav-link ${pathname === '/conferencia' ? 'active' : ''}`}>{t.conferencia}</Link>
            <Link
              href="/noticias"
              className={`nav-link ${pathname === '/noticias' || pathname.startsWith('/noticias/') || pathname === '/blog' ? 'active' : ''}`}
            >
              {t.blog}
            </Link>
            <Link href="/contacte-nos" className={`nav-link ${pathname === '/contacte-nos' ? 'active' : ''}`}>{t.contacto}</Link>
          </nav>
          
          <div className="header-actions">
            <Link href="/admin/login" className="login-btn">
              {t.entrar}
            </Link>

            <div className="search-icon">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
