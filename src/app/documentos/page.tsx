'use client';

import { useCallback, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import SiteDocumentsList from '@/components/Site/SiteDocumentsList';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import { conferenceDocumentsPageCopy } from '@/i18n/messages';
import '@/app/documentos-gerais/documentos.css';

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
      <main className="main-content">
        <div className="hero">
          <div className="container">
            <h1 className="hero-title">{pageCopy.pageTitle}</h1>
          </div>
        </div>
        <div className="container section-container" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-area">
            <ConferenceSubmissionForm onSubmitted={handleSubmitted} labels={conferenceCopy.form} />
            <h2 className="docs-section-title">{conferenceCopy.publishedTitle}</h2>
            <SiteDocumentsList key={refreshKey} category="conferencia" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
