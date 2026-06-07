'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { buildSiteSearchIndex } from '@/data/site-search-index';
import { useLocalizedNews } from '@/hooks/useLocalizedNews';
import { searchSiteContent, type SiteSearchResult } from '@/lib/site-search';
import { scrollBelowSiteHeader } from '@/lib/scroll-page-top';
import { useSiteGeneralConfig } from '@/hooks/useSiteGeneralConfig';
import { DEFAULT_LOGO_URL } from '@/lib/site-general-config';
import { resolveAvatarUrl } from '@/lib/supabase-asset-url';
import '@/components/Blog/BlogLayout.css';
import './Header.css';

const SCROLL_PIN_Y = 96;
const SCROLL_UNPIN_Y = 48;
const HEADER_HEIGHT_FULL = '116px';
const HEADER_HEIGHT_NAV = '72px';

const HOME_SECTIONS = ['conferencia', 'direcao', 'equipa', 'noticias'] as const;
type HomeSectionId = (typeof HOME_SECTIONS)[number];

type SobreSectionId = 'sobre-historia' | 'organograma' | 'sobre-o-que-fazemos' | 'sobre-estatutos';

const translations = {
  pt: {
    homeAria: 'Ir para a página inicial',
    sobre: 'SOBRE-NÓS',
    quemSomos: 'Quem somos',
    sobreSections: [
      { id: 'sobre-historia' as SobreSectionId, label: 'História' },
      { id: 'organograma' as SobreSectionId, label: 'Liderança' },
      { id: 'sobre-o-que-fazemos' as SobreSectionId, label: 'O que fazemos' },
      { id: 'sobre-estatutos' as SobreSectionId, label: 'Estatutos' },
    ],
    conferencia: 'CONFERÊNCIA',
    direcao: 'DIRECÇÃO',
    equipa: 'NOSSA EQUIPA',
    blog: 'BLOG',
    contacto: 'CONTACTOS',
    entrar: 'ENTRAR',
    searchLabel: 'Pesquisar no site',
    searchPlaceholder: 'O que procura?',
    noResults: 'Nenhum resultado encontrado.',
    closeSearch: 'Fechar pesquisa',
  },
  fr: {
    homeAria: "Aller à la page d'accueil",
    sobre: 'À PROPOS',
    quemSomos: 'Qui sommes-nous',
    sobreSections: [
      { id: 'sobre-historia' as SobreSectionId, label: 'Histoire' },
      { id: 'organograma' as SobreSectionId, label: 'Direction' },
      { id: 'sobre-o-que-fazemos' as SobreSectionId, label: 'Ce que nous faisons' },
      { id: 'sobre-estatutos' as SobreSectionId, label: 'Statuts' },
    ],
    conferencia: 'CONFÉRENCE',
    direcao: 'DIRECTION',
    equipa: 'NOTRE ÉQUIPE',
    blog: 'BLOG',
    contacto: 'CONTACTS',
    entrar: 'SE CONNECTER',
    searchLabel: 'Rechercher sur le site',
    searchPlaceholder: 'Que recherchez-vous ?',
    noResults: 'Aucun résultat trouvé.',
    closeSearch: 'Fermer la recherche',
  },
  en: {
    homeAria: 'Go to homepage',
    sobre: 'ABOUT US',
    quemSomos: 'Who we are',
    sobreSections: [
      { id: 'sobre-historia' as SobreSectionId, label: 'History' },
      { id: 'organograma' as SobreSectionId, label: 'Leadership' },
      { id: 'sobre-o-que-fazemos' as SobreSectionId, label: 'What we do' },
      { id: 'sobre-estatutos' as SobreSectionId, label: 'Statutes' },
    ],
    conferencia: 'CONFERENCE',
    direcao: 'LEADERSHIP',
    equipa: 'OUR TEAM',
    blog: 'BLOG',
    contacto: 'CONTACT',
    entrar: 'SIGN IN',
    searchLabel: 'Search the site',
    searchPlaceholder: 'What are you looking for?',
    noResults: 'No results found.',
    closeSearch: 'Close search',
  },
} as const;

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const { news } = useLocalizedNews();
  const [navPinned, setNavPinned] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SiteSearchResult[] | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelId = useId();

  const t = translations[locale];
  const isHome = pathname === '/';
  const { general } = useSiteGeneralConfig();
  const logoSrc = resolveAvatarUrl(general.logoUrl) || DEFAULT_LOGO_URL;

  const searchIndex = useMemo(() => buildSiteSearchIndex(locale, news), [locale, news]);

  const scrollToSection = useCallback((sectionId: HomeSectionId) => {
    scrollBelowSiteHeader(sectionId);
    window.history.replaceState(null, '', `/#${sectionId}`);
  }, []);

  const handleSectionClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, sectionId: HomeSectionId) => {
      event.preventDefault();
      scrollToSection(sectionId);
    },
    [scrollToSection],
  );

  const renderSectionNavLink = (
    sectionId: HomeSectionId,
    pagePath: string,
    label: string,
    className: string,
  ) => {
    if (isHome) {
      return (
        <a
          href={`#${sectionId}`}
          className={className}
          onClick={(event) => handleSectionClick(event, sectionId)}
        >
          {label}
        </a>
      );
    }

    return (
      <Link href={pagePath} className={className}>
        {label}
      </Link>
    );
  };

  const handleSobreSectionClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, sectionId: SobreSectionId) => {
      if (pathname !== '/sobre-nos') return;

      event.preventDefault();
      scrollBelowSiteHeader(sectionId);
      window.history.replaceState(null, '', `/sobre-nos#${sectionId}`);
    },
    [pathname],
  );

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

  useEffect(() => {
    if (!isHome) return;

    const hash = window.location.hash.replace('#', '') as HomeSectionId;
    if (!HOME_SECTIONS.includes(hash)) return;

    const timer = window.setTimeout(() => scrollBelowSiteHeader(hash), 120);
    return () => window.clearTimeout(timer);
  }, [isHome, pathname]);

  useEffect(() => {
    if (!searchOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 120);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [searchOpen]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery('');
        setSearchResults(null);
        return false;
      }
      setSearchResults(null);
      return true;
    });
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    setSearchResults(searchSiteContent(searchIndex, query));
  };

  const handleResultClick = () => {
    closeSearch();
  };

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
              src={logoSrc}
              alt={`${general.siteName} Logo`}
              width={150}
              height={42}
              className="logo-image"
              priority
              unoptimized={logoSrc.startsWith('http')}
            />
          </Link>
          
          <nav className="nav">
            <Link href="/" className="nav-home-link" aria-label={t.homeAria}>
              <HomeIcon />
            </Link>

            <div className="nav-dropdown">
              <span
                className={`nav-link nav-link--dropdown-trigger ${pathname === '/sobre-nos' ? 'active' : ''}`}
                aria-haspopup="menu"
              >
                {t.sobre}
              </span>
              <ul className="nav-dropdown-menu" role="menu" aria-label={t.sobre}>
                <li role="none">
                  <Link
                    href="/sobre-nos"
                    className={`nav-dropdown-item ${pathname === '/sobre-nos' ? 'nav-dropdown-item--active' : ''}`}
                    role="menuitem"
                  >
                    {t.quemSomos}
                  </Link>
                </li>
                {t.sobreSections.map((section) => (
                  <li key={section.id} role="none">
                    <Link
                      href={`/sobre-nos#${section.id}`}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={(event) => handleSobreSectionClick(event, section.id)}
                    >
                      {section.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {renderSectionNavLink(
              'conferencia',
              '/conferencia',
              t.conferencia,
              `nav-link ${pathname === '/conferencia' ? 'active' : ''}`,
            )}
            {renderSectionNavLink('direcao', '/#direcao', t.direcao, 'nav-link')}
            {renderSectionNavLink('equipa', '/#equipa', t.equipa, 'nav-link')}
            {renderSectionNavLink(
              'noticias',
              '/noticias',
              t.blog,
              `nav-link ${pathname === '/noticias' || pathname.startsWith('/noticias/') ? 'active' : ''}`,
            )}
            <Link href="/contacte-nos" className={`nav-link ${pathname === '/contacte-nos' ? 'active' : ''}`}>
              {t.contacto}
            </Link>
          </nav>
          
          <div className="header-actions">
            <Link href="/dashboard/login?next=/dashboard" className="login-btn">
              {t.entrar}
            </Link>

            <button
              type="button"
              className={`search-icon${searchOpen ? ' search-icon--active' : ''}`}
              onClick={toggleSearch}
              aria-expanded={searchOpen}
              aria-controls={searchPanelId}
              aria-label={t.searchLabel}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {searchOpen ? (
        <button
          type="button"
          className="header-search-backdrop"
          aria-label={t.closeSearch}
          onClick={closeSearch}
        />
      ) : null}

      <div
        id={searchPanelId}
        className={`header-search-panel${searchOpen ? ' header-search-panel--open' : ''}`}
        aria-hidden={!searchOpen}
      >
        <div className="header-search-panel-track">
          <div className="header-search-form-wrap">
            <form className="header-search-form" role="search" aria-label={t.searchLabel} onSubmit={handleSearchSubmit}>
              <div className="header-search-field">
                <svg className="header-search-field-icon" aria-hidden="true" width="18" height="18" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  name="q"
                  className="header-search-input"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    if (searchResults !== null) setSearchResults(null);
                  }}
                  tabIndex={searchOpen ? 0 : -1}
                />
              </div>
            </form>
          </div>

          {searchResults !== null ? (
            <div className="header-search-results" aria-live="polite">
              <div className="header-search-results-inner">
                {searchResults.length === 0 ? (
                  <p className="header-search-message">{t.noResults}</p>
                ) : (
                  <ul className="header-search-results-list">
                    {searchResults.map((result) => {
                      const imageSrc = result.image?.trim() || null;
                      return (
                        <li key={result.id}>
                          <article className="blog-entry clr header-search-entry has-media">
                            <Link
                              href={result.href}
                              className="blog-entry-link"
                              onClick={handleResultClick}
                            >
                              <div className="blog-entry-inner clr">
                                <div className="thumbnail">
                                  <div className="thumbnail-link">
                                    {imageSrc ? (
                                      <img src={imageSrc} alt="" loading="lazy" />
                                    ) : (
                                      <div className="blog-entry-thumbnail-placeholder" aria-hidden="true" />
                                    )}
                                    <span className="overlay" aria-hidden="true" />
                                  </div>
                                </div>
                                <div className="header-search-entry-body">
                                  <header className="blog-entry-header clr">
                                    <h2 className="blog-entry-title entry-title">{result.title}</h2>
                                  </header>
                                  <p className="header-search-entry-summary">{result.excerpt}</p>
                                </div>
                              </div>
                            </Link>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
