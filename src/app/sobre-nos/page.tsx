'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import SobreDirectionShowcase from '@/components/Site/SobreDirectionShowcase';
import SobreHistoriaIntro from '@/components/Site/SobreHistoriaIntro';
import SobreHistoriaSection from '@/components/Site/SobreHistoriaSection';
import { useLanguage } from '@/context/LanguageContext';
import styles from './sobre-nos.module.css';

const BANNER = {
  pt: 'SOBRE-NÓS',
  en: 'ABOUT US',
  fr: 'À PROPOS',
} as const;

const BANNER_IMAGE = '/Imagens/sobre-nos-banner.png';

export default function SobreNosPage() {
  const { locale } = useLanguage();

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles['sobre-main']}`} role="main">
        <BlogPageBanner title={BANNER[locale]} imageUrl={BANNER_IMAGE} />

        <SobreHistoriaIntro />

        <SobreDirectionShowcase />

        <SobreHistoriaSection />
      </main>
      <Footer />
    </>
  );
}
