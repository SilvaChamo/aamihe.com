'use client';

import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import styles from './ConferenciaTemaIntro.module.css';

export default function ConferenciaTemaIntro() {
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];

  return (
    <section className={styles.section} aria-labelledby="conferencia-tema-titulo">
      <div className="container">
        <div className={styles.introCard}>
          <div className={styles.introContent}>
            <span className={styles.themeNumberWrap} aria-hidden="true">
              <span className={styles.themeNumber}>{t.themeNumber}</span>
            </span>
            <span className={`site-eyebrow ${styles.eyebrow}`}>
              <span className="site-eyebrow-dash" aria-hidden="true" />
              {t.themeLabel}
              <span className="site-eyebrow-dash" aria-hidden="true" />
            </span>
            <h2 id="conferencia-tema-titulo" className={styles.title}>
              {t.themeTitle}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
