'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import { useLanguage } from '@/context/LanguageContext';
import { footerPagesCopy } from '@/i18n/messages';
import styles from './FooterPages.module.css';

const BANNER = '/gallery/Image-5-1-300x209.jpeg';

export default function ArquivoPageContent() {
  const { locale } = useLanguage();
  const t = footerPagesCopy[locale].arquivo;

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles['footer-page']}`} role="main">
        <BlogPageBanner title={t.bannerTitle} breadcrumbLabel={t.breadcrumb} imageUrl={BANNER} />
        <div className={`container ${styles['footer-page-body']}`}>
          <p className={styles['footer-page-intro']}>{t.intro}</p>
          <div className={styles['arquivo-actions']}>
            <Link href="/galeria?tab=arquivo-1" className={`${styles['arquivo-btn']} ${styles['arquivo-btn-primary']}`}>
              {t.ctaGallery} 1
            </Link>
            <Link href="/galeria?tab=arquivo-2" className={`${styles['arquivo-btn']} ${styles['arquivo-btn-primary']}`}>
              {t.ctaGallery} 2
            </Link>
            <Link href="/contacte-nos" className={`${styles['arquivo-btn']} ${styles['arquivo-btn-secondary']}`}>
              {t.ctaContact}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
