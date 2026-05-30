'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConferenciaHeroBanner from '@/components/Site/ConferenciaHeroBanner';
import ConferenciaTemaIntro from '@/components/Site/ConferenciaTemaIntro';
import ConferenciaPageContent from '@/components/Site/ConferenciaPageContent';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import styles from './conferencia.module.css';

export default function ConferenciaPage() {
  const { locale } = useLanguage();
  const conf = CONFERENCIA_COPY[locale];

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${styles.main}`} role="main">
        <ConferenciaHeroBanner />
        <ConferenciaTemaIntro />
        <ConferenciaPageContent />
      </main>
      <Footer
        supportContact={{
          prefix: conf.supportContactPrefix,
          name: conf.contactName,
          emailIntro: conf.supportContactEmailIntro,
          email: conf.contactEmail,
        }}
      />
    </>
  );
}
