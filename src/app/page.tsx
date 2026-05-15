'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import CountriesCarousel from '@/components/CountriesCarousel';
import AboutSection from '@/components/AboutSection';
import ConferenceSection from '@/components/ConferenceSection';
import DirectionSection from '@/components/DirectionSection';
import NewsSection from '@/components/NewsSection';
import { useLanguage } from '@/context/LanguageContext';
import './page.css';

export default function Home() {
  const { locale } = useLanguage();

  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        <CountriesCarousel />
        <AboutSection />
        <ConferenceSection />
        <DirectionSection />
        <NewsSection />
      </main>
      <Footer />
    </>
  );
}
