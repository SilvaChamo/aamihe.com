'use client';

import { useId, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import styles from './ConferenciaHeroBanner.module.css';

const BANNER_IMAGE = '/images/IMG_Bg2.jpg';

function ChevronDownIcon() {
  return (
    <svg className={styles.expandIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default function ConferenciaHeroBanner() {
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();

  const [introLead, ...moreParagraphs] = t.intro;

  return (
    <section
      className={styles.hero}
      style={{ backgroundImage: `url(${BANNER_IMAGE})` }}
      aria-labelledby="conferencia-hero-title"
    >
      <div className={styles.overlay} />
      <div className="container">
        <div className={styles.inner}>
          <p className={`site-eyebrow ${styles.eyebrow}`}>
            <span className="site-eyebrow-dash" aria-hidden="true" />
            {t.dateTitle}
            <span className="site-eyebrow-dash" aria-hidden="true" />
          </p>

          <h1 id="conferencia-hero-title" className={styles.title}>
            {t.date}
          </h1>

          <p className={styles.subtitle}>{t.venue}</p>

          <p className={styles.introLead}>{introLead}</p>

          {moreParagraphs.length > 0 ? (
            <div className={styles.introActions}>
              <div
                className={`${styles.moreContentWrap} ${moreOpen ? styles.moreContentWrapOpen : ''}`}
                aria-hidden={!moreOpen}
              >
                <div id={moreId} className={styles.moreContentInner}>
                  {moreParagraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className={styles.moreText}>
                      {paragraph}
                    </p>
                  ))}
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
                <ChevronDownIcon />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
