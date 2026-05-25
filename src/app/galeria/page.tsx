import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GalleryGrid from '@/components/Site/GalleryGrid';
import '@/components/Site/GalleryGrid.css';

export default function GaleriaPage() {
  return (
    <>
      <Header />
      <main className="main-content">
        <div className="hero">
          <div className="container">
            <h1 className="hero-title">GALERIA</h1>
          </div>
        </div>
        <div className="container section-container" style={{ gridTemplateColumns: '1fr' }}>
          <div className="content-area">
            <Suspense fallback={<p>A carregar...</p>}>
              <GalleryGrid />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
