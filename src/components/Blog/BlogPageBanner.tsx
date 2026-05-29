'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
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
}: BlogPageBannerProps) {
  const pathname = usePathname();
  const { locale } = useLanguage();

  const style = imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined;
  const displayTitle = title?.trim() ?? '';
  const trail =
    breadcrumbs ?? buildBreadcrumbs(pathname, locale, displayTitle, breadcrumbLabel);

  return (
    <section
      id={id}
      className={`blog-page-banner ${imageUrl ? 'blog-page-banner--image' : ''}`}
      style={style}
      aria-label={displayTitle || trail[trail.length - 1]?.label || 'Página'}
    >
      <div className="banner-overlay" />
      <div className="blog-page-banner-inner">
        {displayTitle ? <h1>{displayTitle}</h1> : null}
        {trail.length > 0 ? (
          <nav className="blog-page-breadcrumb" aria-label="Caminho de navegação">
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
