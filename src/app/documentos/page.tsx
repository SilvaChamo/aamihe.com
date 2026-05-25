'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import SiteDocumentsList from '@/components/Site/SiteDocumentsList';
import '@/app/documentos-gerais/documentos.css';

export default function DocumentosConferenciaPage() {
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
            <h1 className="hero-title">DOCUMENTOS DA CONFERÊNCIA</h1>
          </div>
        </div>
        <div className="container section-container" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-area">
            <ConferenceSubmissionForm onSubmitted={handleSubmitted} />
            <h2 className="docs-section-title">Documentos publicados</h2>
            <SiteDocumentsList key={refreshKey} category="conferencia" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
