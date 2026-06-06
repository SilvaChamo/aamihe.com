'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import FooterEntityCard from '@/components/Site/FooterEntityCard';
import { useLanguage } from '@/context/LanguageContext';
import { footerPagesCopy } from '@/i18n/messages';
import { AFFILIATED_UNIVERSITIES, countryVisual } from '@/data/footer-pages-content';
import styles from './FooterPages.module.css';

const BANNER = '/gallery/Blue-and-White-Geometric-Shapes-Conference-Poster.png.webp';

export default function UniversidadesPageContent() {
  const { locale } = useLanguage();
  const t = footerPagesCopy[locale].universidades;

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles['footer-page']}`} role="main">
        <BlogPageBanner title={t.bannerTitle} breadcrumbLabel={t.breadcrumb} imageUrl={BANNER} />
        <div className={`container ${styles['footer-page-body']}`}>
          <div className={styles['entity-grid']}>
            {AFFILIATED_UNIVERSITIES.map((uni) => {
              const flag = countryVisual(uni.countryId);
              return (
                <FooterEntityCard
                  key={uni.id}
                  name={uni.name[locale]}
                  flagImage={flag.image}
                  flagEmoji={flag.flagEmoji}
                  website={uni.website}
                  visitLabel={uni.website ? t.visitSite : undefined}
                />
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
