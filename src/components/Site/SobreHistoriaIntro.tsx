'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import SobreMissaoVisaoCards from '@/components/Site/SobreMissaoVisaoCards';
import styles from './SobreHistoriaIntro.module.css';

export const sobreHistoriaCopy = {
  pt: {
    eyebrow: 'História da AAMIHE',
    title: 'Raízes, missão e compromisso',
    intro:
      'A AAMIHE — Associação Africana de Instituições Metodistas de Ensino Superior é uma associação de instituições de ensino superior da Igreja Metodista Unida ou relacionadas, criada numa reunião das instituições de ensino superior da Igreja Metodista Unida em África, nos dias 6 a 8 de Setembro de 2014, em Nairóbi – Quênia.',
    origin:
      'Na ocasião, estiveram reunidas instituições de ensino superior da Igreja Metodista Unida em África, que discutiram, entre outras questões, a necessidade de formar um fórum comum para partilhar experiências e cooperar no reforço e na consolidação da educação metodista em África. Foi nessa perspectiva que as instituições em questão criaram, de comum acordo, a AAMIHE em Nairóbi (Quênia), com o apoio da Universidade Metodista do Quênia (KeMU).',
    event:
      'O evento envolveu presidentes de faculdades, seminários e universidades, presidentes de conselhos de administração de instituições de ensino superior e especialistas em educação superior convidados pela organização. A reunião concentrou-se na discussão e aprovação da Constituição e do Processo Eleitoral da AAMIHE. Como resultado, o Professor Munashe Furusa (Vice-Reitor da Universidade da África, Zimbabué) foi eleito o primeiro Presidente da AAMIHE.',
    workshops:
      'O evento dedicou ainda várias sessões a workshops e discussões sobre possibilidades de angariação de fundos para beneficiar a educação metodista no contexto africano.',
    showMore: 'Há mais conteúdo',
    showLess: 'Ocultar conteúdo',
    ctaStatutes: 'Ver estatutos',
  },
  en: {
    eyebrow: 'AAMIHE History',
    title: 'Roots, mission and commitment',
    intro:
      'AAMIHE — African Association of Methodist Institutions of Higher Education is an association of higher education institutions of the United Methodist Church or related institutions, created at a meeting of United Methodist higher education institutions in Africa, held from 6 to 8 September 2014 in Nairobi, Kenya.',
    origin:
      'On that occasion, United Methodist higher education institutions across Africa discussed, among other matters, the need to form a common forum to share experiences and cooperate in strengthening and consolidating Methodist education in Africa. It was in this spirit that the institutions jointly established AAMIHE in Nairobi (Kenya), with the support of Kenya Methodist University (KeMU).',
    event:
      'The event brought together presidents of colleges, seminaries and universities, chairs of boards of higher education institutions and higher education specialists invited by the organizers. The meeting focused on discussing and approving the Constitution and Electoral Process of AAMIHE. As a result, Professor Munashe Furusa (Vice-Chancellor of Africa University, Zimbabwe) was elected the first President of AAMIHE.',
    workshops:
      'The event also dedicated several sessions to workshops and discussions on possibilities for raising funds to benefit Methodist education in the African context.',
    showMore: 'More content available',
    showLess: 'Hide content',
    ctaStatutes: 'View constitution',
  },
  fr: {
    eyebrow: 'Histoire de l’AAMIHE',
    title: 'Racines, mission et engagement',
    intro:
      "L'AAMIHE — Association Africaine des Institutions Méthodistes d'Enseignement Supérieur est une association d'institutions d'enseignement supérieur de l'Église Méthodiste Unie ou apparentées, créée lors d'une réunion des institutions d'enseignement supérieur méthodistes en Afrique, les 6, 7 et 8 septembre 2014 à Nairobi, au Kenya.",
    origin:
      "À cette occasion, des institutions d'enseignement supérieur méthodistes unies en Afrique ont discuté, entre autres questions, de la nécessité de former un forum commun pour partager des expériences et coopérer au renforcement et à la consolidation de l'éducation méthodiste en Afrique. C'est dans cette perspective que les institutions concernées ont créé, d'un commun accord, l'AAMIHE à Nairobi (Kenya), avec le soutien de l'Université Méthodiste du Kenya (KeMU).",
    event:
      "L'événement a réuni des présidents de facultés, de séminaires et d'universités, des présidents de conseils d'administration d'institutions d'enseignement supérieur et des spécialistes de l'enseignement supérieur invités par l'organisation. La réunion s'est concentrée sur la discussion et l'approbation de la Constitution et du Processus électoral de l'AAMIHE. Le professeur Munashe Furusa (vice-chancelier de l'Université d'Afrique, Zimbabwe) a été élu premier président de l'AAMIHE.",
    workshops:
      "L'événement a également consacré plusieurs sessions à des ateliers et des discussions sur les possibilités de collecte de fonds au profit de l'éducation méthodiste dans le contexte africain.",
    showMore: 'Plus de contenu',
    showLess: 'Masquer le contenu',
    ctaStatutes: 'Voir les statuts',
  },
} as const;

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SobreHistoriaIntro() {
  const { locale } = useLanguage();
  const t = sobreHistoriaCopy[locale];
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();

  return (
    <section id="sobre-historia" className={styles.section} aria-labelledby="sobre-historia-titulo">
      <div className="container">
        <div className={styles.introCard}>
          <div className={styles.introContent}>
            <span className={`site-eyebrow ${styles.eyebrow}`}>
              <span className="site-eyebrow-dash" aria-hidden="true" />
              {t.eyebrow}
              <span className="site-eyebrow-dash" aria-hidden="true" />
            </span>
            <h2 id="sobre-historia-titulo" className={styles.title}>
              {t.title}
            </h2>
            <p className={styles.introLead}>{t.intro}</p>

            <div className={styles.introActions}>
              <div
                className={`${styles.moreContentWrap} ${moreOpen ? styles.moreContentWrapOpen : ''}`}
                aria-hidden={!moreOpen}
              >
                <div id={moreId} className={styles.moreContentInner}>
                  <p className={styles.moreText}>{t.origin}</p>
                  <p className={styles.moreText}>{t.event}</p>
                  <p className={styles.moreText}>{t.workshops}</p>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.expandToggle} ${moreOpen ? styles.expandToggleOpen : ''}`}
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                aria-controls={moreId}
                aria-label={moreOpen ? t.showLess : t.showMore}
              >
                <span className={styles.expandToggleCircle}>
                  <ChevronDownIcon />
                </span>
              </button>

              <Link href="#sobre-estatutos" className={styles.introCta}>
                {t.ctaStatutes}
              </Link>
            </div>
          </div>
        </div>

        <SobreMissaoVisaoCards className={styles.cardsAfterIntro} />
      </div>
    </section>
  );
}
