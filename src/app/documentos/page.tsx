'use client';

import { useCallback, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPageBanner from '@/components/Blog/BlogPageBanner';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import SiteDocumentsList from '@/components/Site/SiteDocumentsList';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import { conferenceDocumentsPageCopy } from '@/i18n/messages';
import overlay from '@/components/Site/PageOverlayCard.module.css';
import '@/app/documentos-gerais/documentos.css';

const BANNER_IMAGE = '/images/IMG_Bg2.jpg';

export default function DocumentosConferenciaPage() {
  const { locale } = useLanguage();
  const pageCopy = conferenceDocumentsPageCopy[locale];
  const conferenceCopy = CONFERENCIA_COPY[locale];
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <Header />
      <main id="main" className={`site-main clr ${overlay.main}`} role="main">
        <BlogPageBanner title={pageCopy.pageTitle} imageUrl={BANNER_IMAGE} />
        <section className={overlay.section} aria-label={pageCopy.pageTitle}>
          <div className="container">
            <div className={overlay.contentCard}>
              <ConferenceSubmissionForm onSubmitted={handleSubmitted} labels={conferenceCopy.form} />
              <h2 className="docs-section-title">{conferenceCopy.publishedTitle}</h2>
              <SiteDocumentsList key={refreshKey} category="conferencia" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
