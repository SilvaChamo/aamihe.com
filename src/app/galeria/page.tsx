'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GalleryGrid from '@/components/Site/GalleryGrid';
import { useLanguage } from '@/context/LanguageContext';
import { galleryCopy } from '@/i18n/messages';
import '@/components/Site/GalleryGrid.css';

export default function GaleriaPage() {
  const { locale } = useLanguage();
  const t = galleryCopy[locale];

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="hero">
          <div className="container">
            <h1 className="hero-title">{t.pageTitle}</h1>
          </div>
        </div>
        <div className="container section-container" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-area">
            <Suspense fallback={<p>{t.loading}</p>}>
              <GalleryGrid />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
