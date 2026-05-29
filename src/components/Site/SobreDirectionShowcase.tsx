'use client';

import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import {
  boardMembers,
  boardPresident,
  type BoardMember,
} from '@/data/board-members';
import styles from './SobreDirectionShowcase.module.css';

const COPY = {
  pt: {
    orgEyebrow: 'A nossa estrutura',
    orgTitle: 'Liderança',
    orgSubtitle: 'Conheça a equipa que impulsiona a AAMIHE',
  },
  en: {
    orgEyebrow: 'Our structure',
    orgTitle: 'Leadership',
    orgSubtitle: 'Meet the team driving AAMIHE forward',
  },
  fr: {
    orgEyebrow: 'Notre structure',
    orgTitle: 'Direction',
    orgSubtitle: 'Découvrez l’équipe qui porte l’AAMIHE',
  },
} as const;

const ORG_VICE_PRESIDENTS = boardMembers.slice(0, 3);
const ORG_OFFICERS = boardMembers.slice(3, 6);

function OrgConnector({ variant }: { variant: 'one-to-three' | 'three-to-three' }) {
  const path =
    variant === 'one-to-three'
      ? 'M 514 0 L 514 28 L 150 28 L 150 68 M 514 28 L 878 28 L 878 68'
      : 'M 150 0 L 150 28 L 878 28 L 878 0 M 150 28 L 150 68 M 514 28 L 514 68 M 878 28 L 878 68';

  return (
    <svg
      className={styles.orgConnectorSvg}
      viewBox="0 0 1028 68"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className={styles.orgConnectorPath}
        d={path}
        fill="none"
        stroke="url(#sobre-org-line)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrgNode({
  member,
  locale,
  featured,
  tone,
}: {
  member: BoardMember;
  locale: 'pt' | 'en' | 'fr';
  featured?: boolean;
  tone?: 'mid' | 'last';
}) {
  const toneClass =
    tone === 'mid' ? styles.orgNodeMid : tone === 'last' ? styles.orgNodeLast : '';

  return (
    <article
      className={`${styles.orgNode} ${toneClass} ${featured ? styles.orgNodeFeatured : ''}`}
    >
      <div className={`${styles.orgPhotoWrap} ${styles.orgPhotoWrapSquare}`}>
        <Image
          src={member.image}
          alt={member.name}
          width={188}
          height={188}
          className={styles.orgPhoto}
        />
      </div>
      <h4 className={styles.orgName}>{member.name}</h4>
      <p className={styles.orgRole}>{member.role[locale]}</p>
      {member.language ? (
        <p className={styles.orgMeta}>{member.language[locale]}</p>
      ) : null}
    </article>
  );
}

export default function SobreDirectionShowcase() {
  const { locale } = useLanguage();
  const t = COPY[locale];
  const president = boardPresident;

  return (
    <section className={styles.section} aria-labelledby="sobre-org-titulo">
      <div className="container">
        <div className={styles.orgSection} aria-labelledby="sobre-org-titulo">
          <div className={styles.orgBubbles} aria-hidden="true">
            <span className={styles.orgBubble} />
            <span className={styles.orgBubble} />
            <span className={styles.orgBubble} />
            <span className={styles.orgBubble} />
          </div>

          <header className={styles.orgHeader}>
            <div className={styles.orgEyebrow}>
              <span className={styles.orgEyebrowLine} />
              <span>{t.orgEyebrow}</span>
              <span className={styles.orgEyebrowLine} />
            </div>
            <h2 id="sobre-org-titulo" className={styles.orgTitle}>
              {t.orgTitle}
            </h2>
            <p className={styles.orgSubtitle}>{t.orgSubtitle}</p>
          </header>

          <div className={styles.orgChart}>
            <svg width="0" height="0" aria-hidden="true">
              <defs>
                <linearGradient id="sobre-org-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(204, 168, 118, 0)" />
                  <stop offset="15%" stopColor="rgba(204, 168, 118, 0.9)" />
                  <stop offset="85%" stopColor="rgba(204, 168, 118, 0.9)" />
                  <stop offset="100%" stopColor="rgba(204, 168, 118, 0)" />
                </linearGradient>
              </defs>
            </svg>

            <div className={styles.orgRow}>
              <OrgNode member={president} locale={locale} featured />
            </div>

            <OrgConnector variant="one-to-three" />

            <div className={`${styles.orgRow} ${styles.orgRowTriple}`}>
              {ORG_VICE_PRESIDENTS.map((member) => (
                <OrgNode key={member.name} member={member} locale={locale} tone="mid" />
              ))}
            </div>

            <OrgConnector variant="three-to-three" />

            <div className={`${styles.orgRow} ${styles.orgRowTriple}`}>
              {ORG_OFFICERS.map((member) => (
                <OrgNode key={member.name} member={member} locale={locale} tone="last" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
