'use client';

import { useLanguage } from '@/context/LanguageContext';
import '@/components/AboutSection.css';
import styles from './SobreMissaoVisaoCards.module.css';

export const sobreVisaoValoresCopy = {
  pt: {
    visao_title: 'Visão',
    visao_text:
      'Consolidar uma rede africana de excelência em ensino superior metodista, reconhecida pela cooperação institucional, pela qualidade académica e pelo contributo ao desenvolvimento sustentável das comunidades.',
    valores_title: 'Valores',
    valores_text:
      'Cultivar a integridade, a excelência académica, a cooperação fraterna, o respeito pela diversidade e o serviço às comunidades, como princípios que orientam as instituições metodistas de ensino superior em África.',
  },
  en: {
    visao_title: 'Vision',
    visao_text:
      'To consolidate an African network of excellence in Methodist higher education, recognized for institutional cooperation, academic quality and contribution to the sustainable development of communities.',
    valores_title: 'Values',
    valores_text:
      'To cultivate integrity, academic excellence, fraternal cooperation, respect for diversity and service to communities, as values guiding Methodist higher education institutions in Africa in their mission.',
  },
  fr: {
    visao_title: 'Vision',
    visao_text:
      "Consolider un réseau africain d'excellence dans l'enseignement supérieur méthodiste, reconnu pour la coopération institutionnelle, la qualité académique et la contribution au développement durable des communautés.",
    valores_title: 'Valeurs',
    valores_text:
      "Cultiver l'intégrité, l'excellence académique, la coopération fraternelle, le respect de la diversité et le service aux communautés, comme valeurs orientant les institutions méthodistes d'enseignement supérieur en Afrique.",
  },
} as const;

function VisionIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="#561713"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="#561713" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ValuesIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 2l2.4 4.86L20 8.18l-3.8 3.7.9 5.24L12 15.77l-5.1 2.68.9-5.24L4 8.18l5.6-1.32L12 2z"
        stroke="#561713"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  className?: string;
};

export default function SobreMissaoVisaoCards({ className }: Props) {
  const { locale } = useLanguage();
  const t = sobreVisaoValoresCopy[locale];

  return (
    <div
      id="sobre-visao-valores"
      className={`${styles.wrap} ${className ?? ''}`.trim()}
      aria-label={`${t.visao_title} / ${t.valores_title}`}
    >
      <div className={`about-container ${styles.cardsWrap}`}>
        <div className="about-cards-grid">
          <div className="about-card">
            <div className="about-card-header">
              <div className="about-card-icon">
                <VisionIcon />
              </div>
              <h3 className="about-card-title">{t.visao_title}</h3>
            </div>
            <p className="about-card-text">{t.visao_text}</p>
          </div>

          <div className="about-card">
            <div className="about-card-header">
              <div className="about-card-icon">
                <ValuesIcon />
              </div>
              <h3 className="about-card-title">{t.valores_title}</h3>
            </div>
            <p className="about-card-text">{t.valores_text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
