'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PAISES_CAROUSEL } from '@/data/paisesCarousel';
import { useLanguage } from '@/context/LanguageContext';
import { countriesCarouselCopy } from '@/i18n/messages';
import './CountriesCarousel.css';

const AUTOPLAY_MS = 3000; // Reduzido para 3 segundos para ficar mais dinâmico

export default function CountriesCarousel() {
  const { locale } = useLanguage();
  const t = countriesCarouselCopy[locale];
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollNext = useCallback(() => {
    const totalCards = PAISES_CAROUSEL.length;
    const nextIndex = currentIndex + 1;
    
    setCurrentIndex(nextIndex);
    
    if (nextIndex >= totalCards) {
      setTimeout(() => {
        setCurrentIndex(0);
      }, 500);
    }
  }, [currentIndex]);

  const scrollPrev = useCallback(() => {
    const totalCards = PAISES_CAROUSEL.length;
    const prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      setCurrentIndex(totalCards - 1);
    } else {
      setCurrentIndex(prevIndex);
    }
  }, [currentIndex]);

  useEffect(() => {
    const id = window.setInterval(scrollNext, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [scrollNext]);

  return (
    <section className="countries-carousel-section" aria-label={t.ariaLabel}>
      <div className="countries-carousel">
        <button
          type="button"
          className="countries-carousel__arrow countries-carousel__arrow--prev"
          aria-label={t.prev}
          onClick={scrollPrev}
        >
          <ChevronLeft />
        </button>
        <div className="countries-carousel__viewport" ref={trackRef}>
          <div 
            className="countries-carousel__track"
            style={{ 
              transform: `translateX(-${currentIndex * 229}px)`, 
              transition: currentIndex === 0 ? 'none' : 'transform 0.5s ease'
            }}
          >
            {[...PAISES_CAROUSEL, ...PAISES_CAROUSEL].map((p, index) => (
              <article key={`${p.slug}-${index}`} className="countries-carousel__card">
                <div className="countries-carousel__image-wrap">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(max-width: 480px) 45vw, (max-width: 900px) 23vw, 220px"
                    className="countries-carousel__image"
                  />
                </div>
                <p className="countries-carousel__label">{p.label}</p>
              </article>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="countries-carousel__arrow countries-carousel__arrow--next"
          aria-label={t.next}
          onClick={scrollNext}
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M119 47.3166C119 48.185 118.668 48.9532 118.003 49.6212L78.8385 89L118.003 128.379C118.668 129.047 119 129.815 119 130.683C119 131.552 118.668 132.32 118.003 132.988L113.021 137.998C112.356 138.666 111.592 139 110.729 139C109.865 139 109.101 138.666 108.436 137.998L61.9966 91.3046C61.3322 90.6366 61 89.8684 61 89C61 88.1316 61.3322 87.3634 61.9966 86.6954L108.436 40.002C109.101 39.334 109.865 39 110.729 39C111.592 39 112.356 39.334 113.021 40.002L118.003 45.012C118.668 45.68 119 46.4482 119 47.3166Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ transform: 'scaleX(-1)' }}>
      <path
        d="M119 47.3166C119 48.185 118.668 48.9532 118.003 49.6212L78.8385 89L118.003 128.379C118.668 129.047 119 129.815 119 130.683C119 131.552 118.668 132.32 118.003 132.988L113.021 137.998C112.356 138.666 111.592 139 110.729 139C109.865 139 109.101 138.666 108.436 137.998L61.9966 91.3046C61.3322 90.6366 61 89.8684 61 89C61 88.1316 61.3322 87.3634 61.9966 86.6954L108.436 40.002C109.101 39.334 109.865 39 110.729 39C111.592 39 112.356 39.334 113.021 40.002L118.003 45.012C118.668 45.68 119 46.4482 119 47.3166Z"
        fill="currentColor"
      />
    </svg>
  );
}
