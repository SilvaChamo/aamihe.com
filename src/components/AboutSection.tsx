'use client';

import { useLanguage } from '@/context/LanguageContext';
import './AboutSection.css';

export const homeAboutCopy = {
  pt: {
    sobre_title: 'Sobre Nós',
    sobre_text: 'A AAIMES – Associação Africana de Instituições Metodistas de Ensino Superior é uma associação de instituições de ensino superior da Igreja Metodista Unida ou relacionadas.',
    missao_title: 'Missão',
    missao_text: 'Partilhar e compartilhar experiências, desencadear mecanismos de cooperação para reforçar a consolidação das instituições de ensino superior Metodista em África.',
    btn: 'Ler Mais',
  },
  fr: {
    sobre_title: 'À Propos',
    sobre_text: 'L\'AAIMDS – Association Africaine des Institutions Méthodistes d\'Enseignement Supérieur é uma associação d\'institutions d\'enseignement supérieur de l\'Église Méthodiste Unie ou apparentées.',
    missao_title: 'Mission',
    missao_text: 'Partager et échanger des expériences, déclencher des mécanismes de coopération para renforcer la consolidation des institutions méthodistes d\'enseignement supérieur en Afrique.',
    btn: 'Lire la suite',
  },
  en: {
    sobre_title: 'About Us',
    sobre_text: 'AAMIHE – African Association of Methodist Institutions of Higher Education is an association of higher education institutions of the United Methodist Church or related.',
    missao_title: 'Mission',
    missao_text: 'To share and exchange experiences, trigger cooperation mechanisms to strengthen the consolidation of Methodist higher education institutions in Africa.',
    btn: 'Read More',
  },
};

export default function AboutSection() {
  const { locale } = useLanguage();
  const t = homeAboutCopy[locale];

  return (
    <section className="about-section" id="sobre-nos">
      <div className="about-container">
        <div className="about-cards-grid">
          {/* Card 1: Sobre Nós */}
          <div className="about-card">
            <div className="about-card-header">
              <div className="about-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="about-card-title">{t.sobre_title}</h2>
            </div>
            <p className="about-card-text">{t.sobre_text}</p>
          </div>

          {/* Card 2: Missão */}
          <div className="about-card">
            <div className="about-card-header">
              <div className="about-card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="6" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="2" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Seta do Alvo (Flecha) */}
                  <path d="M22 2L14 10" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 6H10V10H14V6Z" fill="#561713"/> {/* Ponta da flecha como um pequeno bloco ou ponta */}
                </svg>
              </div>
              <h2 className="about-card-title">{t.missao_title}</h2>
            </div>
            <p className="about-card-text">{t.missao_text}</p>
          </div>
        </div>

        {/* Button below cards */}
        <div className="about-actions-center">
          <a href="/sobre-nos" className="about-btn-readmore">
            <span>{t.btn}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
