'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import GalleryGrid from '@/components/Site/GalleryGrid';
import { useLanguage } from '@/context/LanguageContext';
import { footerPagesCopy, galleryCopy } from '@/i18n/messages';
import overlay from '@/components/Site/PageOverlayCard.module.css';
import '@/components/Site/GalleryGrid.css';

const BANNER = '/Imagens/BgNoticias.jpeg';

export default function GaleriaPage() {
  const { locale } = useLanguage();
  const page = footerPagesCopy[locale].galeria;
  const t = galleryCopy[locale];

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${overlay.main}`} role="main">
        <BlogPageBanner
          title={page.bannerTitle}
          breadcrumbLabel={page.breadcrumb}
          imageUrl={BANNER}
        />
        <section className={overlay.section} aria-label={page.bannerTitle}>
          <div className="container">
            <div className={overlay.contentCard}>
              <Suspense fallback={<p className="gallery-empty">{t.loading}</p>}>
                <GalleryGrid />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
