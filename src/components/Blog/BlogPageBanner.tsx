'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { commonUiCopy } from '@/i18n/messages';
import './BlogLayout.css';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BlogPageBannerProps = {
  id?: string;
  title?: string;
  imageUrl?: string;
  breadcrumbLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
  languageSlides?: readonly {
    id: 'pt' | 'en' | 'fr';
    title: string;
    image?: string;
    description?: string;
  }[];
};

const HOME_LABEL = {
  pt: 'Início',
  en: 'Home',
  fr: 'Accueil',
} as const;

const BLOG_LABEL = {
  pt: 'Blog',
  en: 'Blog',
  fr: 'Blog',
} as const;

const CONTACT_LABEL = {
  pt: 'Contacte-nos',
  en: 'Contact us',
  fr: 'Contactez-nous',
} as const;

const ABOUT_LABEL = {
  pt: 'Sobre-nós',
  en: 'About us',
  fr: 'À propos',
} as const;

const GALLERY_LABEL = {
  pt: 'Galeria',
  en: 'Gallery',
  fr: 'Galerie',
} as const;

const MEMBER_COUNTRIES_LABEL = {
  pt: 'Países membros',
  en: 'Member countries',
  fr: 'Pays membres',
} as const;

const UNIVERSITIES_LABEL = {
  pt: 'Universidades filiais',
  en: 'Affiliated universities',
  fr: 'Universités affiliées',
} as const;

const ARCHIVE_LABEL = {
  pt: 'Arquivo',
  en: 'Archive',
  fr: 'Archives',
} as const;

function buildBreadcrumbs(
  pathname: string,
  locale: keyof typeof HOME_LABEL,
  title: string,
  breadcrumbLabel?: string,
): BreadcrumbItem[] {
  const home: BreadcrumbItem = { label: HOME_LABEL[locale], href: '/' };
  const lastLabel = breadcrumbLabel?.trim() || title.trim();

  if (pathname === '/contacte-nos') {
    return [home, { label: lastLabel || CONTACT_LABEL[locale] }];
  }

  if (pathname === '/sobre-nos') {
    return [home, { label: lastLabel || ABOUT_LABEL[locale] }];
  }

  if (pathname === '/galeria') {
    return [home, { label: lastLabel || GALLERY_LABEL[locale] }];
  }

  if (pathname === '/paises') {
    return [home, { label: lastLabel || MEMBER_COUNTRIES_LABEL[locale] }];
  }

  if (pathname === '/universidades') {
    return [home, { label: lastLabel || UNIVERSITIES_LABEL[locale] }];
  }

  if (pathname === '/arquivo') {
    return [home, { label: lastLabel || ARCHIVE_LABEL[locale] }];
  }

  if (pathname === '/noticias') {
    return [home, { label: lastLabel || BLOG_LABEL[locale] }];
  }

  if (pathname.startsWith('/noticias/')) {
    const items: BreadcrumbItem[] = [home, { label: BLOG_LABEL[locale], href: '/noticias' }];
    if (lastLabel) {
      items.push({ label: lastLabel });
    }
    return items;
  }

  if (lastLabel) {
    return [home, { label: lastLabel }];
  }

  return [home];
}

export default function BlogPageBanner({
  id = 'blog-banner-start',
  title = 'BLOG',
  imageUrl,
  breadcrumbLabel,
  breadcrumbs,
  languageSlides,
}: BlogPageBannerProps) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const ui = commonUiCopy[locale];
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = languageSlides?.length ? languageSlides : null;
  const carouselSlides =
    slides && slides.length > 0 && slides.every((slide) => slide.image) ? slides : null;
  const style =
    imageUrl && !carouselSlides ? { backgroundImage: `url(${imageUrl})` } : undefined;
  const displayTitle = slides ? slides[slideIndex]?.title ?? '' : title?.trim() ?? '';
  const trail =
    breadcrumbs ?? buildBreadcrumbs(pathname, locale, displayTitle, breadcrumbLabel);

  useEffect(() => {
    if (!slides) return;

    const index = slides.findIndex((slide) => slide.id === locale);
    if (index !== -1) {
      setSlideIndex(index);
    }
  }, [locale, slides]);

  useEffect(() => {
    if (!slides || slides.length < 2) return;

    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides]);

  return (
    <section
      id={id}
      className={`blog-page-banner${imageUrl || carouselSlides ? ' blog-page-banner--image' : ''}${
        slides ? ' blog-page-banner--language-slides' : ''
      }${carouselSlides ? ' blog-page-banner--slide-carousel' : ''}`}
      style={style}
      aria-label={displayTitle || trail[trail.length - 1]?.label || ui.pageFallback}
      aria-roledescription={carouselSlides ? 'carousel' : undefined}
    >
      {carouselSlides ? (
        <div className="blog-page-banner__bg-viewport" aria-hidden="true">
          {carouselSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`blog-page-banner__bg-slide ${index === slideIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>
      ) : null}
      <div className="banner-overlay" />
      <div className="blog-page-banner-inner">
        {slides ? (
          <div className="blog-page-banner-titles" aria-live="polite">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`blog-page-banner-title-stack ${index === slideIndex ? 'active' : ''}`}
                lang={slide.id}
                aria-hidden={index !== slideIndex}
              >
                <h1>{slide.title}</h1>
                {slide.description ? (
                  <p className="blog-page-banner-slide-desc">{slide.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : displayTitle ? (
          <h1>{displayTitle}</h1>
        ) : null}
        {trail.length > 0 ? (
          <nav className="blog-page-breadcrumb" aria-label={ui.breadcrumbNav}>
            <ol>
              {trail.map((item, index) => {
                const isLast = index === trail.length - 1;
                return (
                  <li key={`${item.label}-${index}`}>
                    {item.href && !isLast ? (
                      <Link href={item.href}>{item.label}</Link>
                    ) : (
                      <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
