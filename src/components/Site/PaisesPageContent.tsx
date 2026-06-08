'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import FooterEntityCard from '@/components/Site/FooterEntityCard';
import { useLanguage } from '@/context/LanguageContext';
import { footerPagesCopy } from '@/i18n/messages';
import { MEMBER_COUNTRIES } from '@/data/footer-pages-content';
import overlay from '@/components/Site/PageOverlayCard.module.css';
import styles from './FooterPages.module.css';

const BANNER = '/Imagens/BgNoticias.jpeg';

export default function PaisesPageContent() {
  const { locale } = useLanguage();
  const t = footerPagesCopy[locale].paises;

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${overlay.main}`} role="main">
        <BlogPageBanner title={t.bannerTitle} breadcrumbLabel={t.breadcrumb} imageUrl={BANNER} />
        <section className={overlay.section} aria-label={t.bannerTitle}>
          <div className="container">
            <div className={overlay.contentCard}>
              <div className={styles['entity-grid']}>
                {MEMBER_COUNTRIES.map((country) => (
                  <FooterEntityCard
                    key={country.id}
                    name={country.name[locale]}
                    flagImage={country.image}
                    flagEmoji={country.flagEmoji}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
