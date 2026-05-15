'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState } from 'react';
import './DirectionSection.css';

const boardMembers = [
  {
    name: 'Rosemary Nyarugwe',
    role: {
      pt: 'Presidente',
      en: 'President',
      fr: 'Présidente',
    },
    image: '/gallery/Vice-President-Anglophone-Rosemary.jpg.webp',
    language: { pt: 'Inglês', en: 'English', fr: 'Anglais' }
  },
  {
    name: 'Tiago Mutombo',
    role: {
      pt: 'Vice-Presidente',
      en: 'Vice-President',
      fr: 'Vice-Président',
    },
    image: '/gallery/3-Tiago-Caungo-Mutombo-Vice-President-Lusophone-compressed-scaled.jpg.webp',
    language: { pt: 'Português', en: 'Portuguese', fr: 'Portugais' }
  },
  {
    name: 'René Gnalega',
    role: {
      pt: 'Vice-Presidente',
      en: 'Vice-President',
      fr: 'Vice-Président',
    },
    image: '/gallery/4-Rene-Gnalega-Vice-President-Francophone-compressed-scaled.jpg.webp',
    language: { pt: 'Francês', en: 'French', fr: 'Français' }
  },
  {
    name: 'Yar Gonway-Gono',
    role: {
      pt: 'Vice-Presidente',
      en: 'Vice-President',
      fr: 'Vice-Présidente',
    },
    image: '/gallery/5-Yar-Donlah-Gonway-Gono-Vice-President-Anglophone-compressed-scaled.jpg.webp',
    language: { pt: 'Inglês', en: 'English', fr: 'Anglais' }
  },
  {
    name: 'Jamisse Taimo',
    role: {
      pt: 'Director Executivo',
      en: 'Executive Officer',
      fr: 'Directeur Exécutif',
    },
    image: '/gallery/7-Jamisse-Taimo-Consultants-Executive-Officer-compressed-scaled.jpg.webp',
  },
  {
    name: 'Tukumbi Lumumba',
    role: {
      pt: 'Consultor',
      en: 'Consultant',
      fr: 'Consultant',
    },
    image: '/gallery/9-Tukumbi-Lumumba-Kasongo-Consultants-compressed-scaled.jpg.webp',
  },
  {
    name: 'Peter Mageto',
    role: {
      pt: 'Secretário',
      en: 'Secretary',
      fr: 'Secrétaire',
    },
    image: '/gallery/6-Peter-Mageto-Secretary-compressed-scaled.jpg.webp',
  },
];

const translations = {
  pt: {
    title: 'A Direcção',
    subtitle: 'A AAIMES é uma associação de instituições de ensino superior da Igreja Metodista Unida ou relacionadas, unanimamente criada numa conferência das instituições de ensino superior da Igreja Metodista Unida em África, em Setembro de 2014, em Nairóbi – Quênia.',
    btn1: 'Saber Mais',
    btn2: 'Falar Connosco',
    infoPaíses: 'Países Membros',
    infoUniversidades: 'Universidades',
    infoFundação: 'Ano de Fundação',
    infoAfiliação: 'Afiliação Metodista',
  },
  fr: {
    title: 'La Direction',
    subtitle: 'L\'AAIMES est une association d\'institutions d\'enseignement supérieur de l\'Église Méthodiste Unie ou apparentées, créée à l\'unanimité lors d\'une conférence des institutions d\'enseignement supérieur de l\'Église Méthodiste Unie en Afrique, en septembre 2014, à Nairobi – Kenya.',
    btn1: 'En savoir plus',
    btn2: 'Nous parler',
    infoPaíses: 'Pays Membres',
    infoUniversidades: 'Universités',
    infoFundação: 'Année de Fondation',
    infoAfiliação: 'Affiliation Méthodiste',
  },
  en: {
    title: 'The Direction',
    subtitle: 'AAMIHE is an association of United Methodist or related higher education institutions, unanimously created at a conference of United Methodist higher education institutions in Africa in September 2014 in Nairobi – Kenya.',
    btn1: 'Learn More',
    btn2: 'Talk to Us',
    infoPaíses: 'Member Countries',
    infoUniversidades: 'Universities',
    infoFundação: 'Foundation Year',
    infoAfiliação: 'Methodist Affiliation',
  },
};

export default function DirectionSection() {
  const { locale } = useLanguage();
  const t = translations[locale];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const nextSlide = () => {
    if (activeIndex >= boardMembers.length) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (activeIndex <= 0) {
      // Para o prev ser infinito também, precisaríamos de clones no início. 
      // Por agora vamos focar no avanço fluido solicitado.
      setActiveIndex(boardMembers.length - 1);
    } else {
      setIsTransitioning(true);
      setActiveIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (activeIndex === boardMembers.length) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setActiveIndex(0);
      }, 600); // Deve coincidir com o tempo da transição no CSS
      return () => clearTimeout(timer);
    }
  }, [activeIndex]);

  useEffect(() => {
    const id = setInterval(nextSlide, 4000);
    return () => clearInterval(id);
  }, [activeIndex]);

  return (
    <section className="direction-section" id="direcao">
      <div className="direction-container">
        {/* Header Centrado */}
        <div className="direction-header">
          <h2 className="direction-title">{t.title}</h2>
          <div className="direction-divider"></div>
          <p className="direction-subtitle">{t.subtitle}</p>
        </div>

        {/* Carrossel de Membros */}
        <div className="direction-slider-wrapper">
          <button 
            className="slider-arrow prev" 
            onClick={() => setActiveIndex((prev) => (prev - 1 + boardMembers.length) % boardMembers.length)}
          >
            <ChevronLeft />
          </button>

          <div className="direction-viewport">
            <div 
              className="direction-track"
              style={{ 
                transform: `translateX(-${activeIndex * (100 / 4)}%)`,
                transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            >
              {[...boardMembers, ...boardMembers.slice(0, 4)].map((member, index) => (
                <div key={index} className="member-slide">
                  <div className="member-card-inner">
                    <div className="member-image-wrapper">
                      <img src={member.image} alt={member.name} className="member-photo" />
                    </div>
                    <div className="member-details">
                      <h3 className="member-name">{member.name}</h3>
                      <p className="member-role">{member.role[locale]}</p>
                      {member.language && (
                        <div className="member-language-wrapper">
                          <span className="lang-line"></span>
                          <span className="member-language">{member.language[locale]}</span>
                          <span className="lang-line"></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            className="slider-arrow next" 
            onClick={nextSlide}
          >
            <ChevronRight />
          </button>
        </div>

        {/* Botão de Ação Único Centrado */}
        <div className="direction-actions-center">
          <button className="btn-direction-readmore">{t.btn1}</button>
        </div>
      </div>

      {/* Info Bar Refinada */}
      <div className="direction-stats-bar">
        <div className="direction-container">
          <div className="stats-list">
            <div className="stats-item">
              <span className="stats-number">11</span>
              <span className="stats-label">{t.infoPaíses}</span>
            </div>
            <div className="stats-item">
              <span className="stats-number">15</span>
              <span className="stats-label">{t.infoUniversidades}</span>
            </div>
            <div className="stats-item">
              <span className="stats-number">2014</span>
              <span className="stats-label">{t.infoFundação}</span>
            </div>
            <div className="stats-item">
              <span className="stats-number">UMC</span>
              <span className="stats-label">{t.infoAfiliação}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
