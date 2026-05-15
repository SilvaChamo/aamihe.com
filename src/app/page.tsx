'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import CountriesCarousel from '@/components/CountriesCarousel';
import AboutSection from '@/components/AboutSection';
import ConferenceSection from '@/components/ConferenceSection';
import DirectionSection from '@/components/DirectionSection';
import NewsletterSection from '@/components/NewsletterSection';
import NewsSection from '@/components/NewsSection';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';
import './page.css';

export default function Home() {
  const { locale } = useLanguage();

  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', reveal);
    reveal(); // Verifica posição inicial
    return () => window.removeEventListener('scroll', reveal);
  }, []);

  return (
    <>
      <Header />
      <main>
        <HeroBanner />
        
        <div className="reveal">
          <CountriesCarousel />
        </div>
        
        <div className="reveal">
          <AboutSection />
        </div>
        
        <div className="reveal">
          <ConferenceSection />
        </div>
        
        <div className="reveal">
          <DirectionSection />
        </div>
        
        <div className="reveal">
          <NewsletterSection />
        </div>
        
        <div className="reveal">
          <NewsSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
