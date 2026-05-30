'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConferenciaHeroBanner from '@/components/Site/ConferenciaHeroBanner';
import ConferenciaTemaIntro from '@/components/Site/ConferenciaTemaIntro';
import ConferenciaPageContent from '@/components/Site/ConferenciaPageContent';
import styles from './conferencia.module.css';

export default function ConferenciaPage() {
  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles.main}`} role="main">
        <ConferenciaHeroBanner />
        <ConferenciaTemaIntro />
        <ConferenciaPageContent />
      </main>
      <Footer />
    </>
  );
}
