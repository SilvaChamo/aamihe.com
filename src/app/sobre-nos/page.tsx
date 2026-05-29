'use client';

import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import SobreDirectionShowcase from '@/components/Site/SobreDirectionShowcase';
import SobreHistoriaIntro from '@/components/Site/SobreHistoriaIntro';
import SobreHistoriaSection from '@/components/Site/SobreHistoriaSection';
import SobreOQueFazemos from '@/components/Site/SobreOQueFazemos';
import { scrollBelowSiteHeader } from '@/lib/scroll-page-top';
import styles from './sobre-nos.module.css';

const BANNER_IMAGE = '/Imagens/sobre-nos-banner.png';

export default function SobreNosPage() {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const timer = window.setTimeout(() => scrollBelowSiteHeader(hash), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles['sobre-main']}`} role="main">
        <BlogPageBanner
          title="SOBRE-NÓS"
          breadcrumbLabel="Sobre-nós"
          imageUrl={BANNER_IMAGE}
        />

        <SobreHistoriaIntro />

        <SobreDirectionShowcase />

        <SobreOQueFazemos />

        <SobreHistoriaSection />
      </main>
      <Footer />
    </>
  );
}
