'use client';

import type { CSSProperties } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { heroBannerCopy } from '@/i18n/messages';
import './HeroBanner.css';

const slides = [
  {
    id: 'pt',
    title: 'BEM–VINDO',
    description:
      'Associação Africana de Instituições Metodistas de Ensino Superior - AAIMES',
    image: '/images/hero-banner-bg.jpg',
  },
  {
    id: 'fr',
    title: 'BIENVENUE',
    description:
      'Association africaine des institutions méthodistes d’enseignement supérieur - AAIMDS',
    image: '/images/França.jpg',
  },
  {
    id: 'en',
    title: 'WELCOME',
    description:
      'African Association of Methodist Institutions of Higher Education - AAMIHE',
    image: '/images/London.jpg',
  },
] as const;

import { useCallback, useEffect, useState } from 'react';

const DISSOLVE_CYCLE_S = 5; // Tempo de cada slide

function SlideContent({
  title,
  description,
}: { title: string; description: string }) {
  return (
    <>
      <h1 className="hero-banner__title">{title}</h1>
      <p className="hero-banner__description">{description}</p>
    </>
  );
}

export default function HeroBanner() {
  const { locale } = useLanguage();
  const t = heroBannerCopy[locale];
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Quando a língua muda, pula para o slide correspondente
  useEffect(() => {
    const index = slides.findIndex(s => s.id === locale);
    if (index !== -1) {
      setCurrentSlideIndex(index);
    }
  }, [locale]);

  // Slide automático
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, DISSOLVE_CYCLE_S * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="hero-banner"
      aria-roledescription="carousel"
      aria-label={t.ariaLabel}
    >
      <div className="hero-banner__viewport">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-banner__slide ${index === currentSlideIndex ? 'active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={slide.title}
            style={
              {
                '--hero-bg-image': `url(${slide.image})`,
              } as CSSProperties
            }
          >
            <SlideContent title={slide.title} description={slide.description} />
          </div>
        ))}
      </div>
    </section>
  );
}
