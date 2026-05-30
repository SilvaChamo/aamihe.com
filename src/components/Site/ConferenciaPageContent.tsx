'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import {
  CONFERENCIA_COPY,
  CONFERENCIA_PARTNERS,
} from '@/data/conferencia-content';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import SiteDocumentsList from '@/components/Site/SiteDocumentsList';
import styles from './ConferenciaPageContent.module.css';

export default function ConferenciaPageContent() {
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <section className={styles.subthemesSection}>
        <div className="container">
          <div className={styles.sectionDivider}>
            <span>{t.subthemesTitle}</span>
          </div>
          <div className={styles.subthemesGrid}>
            {t.subthemes.map((item, index) => (
              <article key={item} className={styles.subthemeCard}>
                <span className={styles.subthemeIndex}>{index + 1}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.planSection}>
        <div className="container">
          <div className={styles.planHeader}>
            <span className={`site-eyebrow ${styles.planEyebrow}`}>
              <span className="site-eyebrow-dash" aria-hidden="true" />
              {t.planEyebrow}
              <span className="site-eyebrow-dash" aria-hidden="true" />
            </span>
            <h2 className={styles.planTitle}>{t.planTitle}</h2>
            <div className={styles.planLine} />
          </div>
          <div className={styles.timelineGrid}>
            {t.timeline.map((item) => (
              <article key={item.title} className={styles.timelineCard}>
                <h3>{item.title}</h3>
                <p>{item.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.feesSection}>
        <div className="container">
          <div className={styles.feesHeader}>
            <span className={`site-eyebrow ${styles.feesEyebrow}`}>
              <span className="site-eyebrow-dash" aria-hidden="true" />
              {t.feesEyebrow}
              <span className="site-eyebrow-dash" aria-hidden="true" />
            </span>
            <h2>{t.feesTitle}</h2>
          </div>
          <div className={styles.feesGrid}>
            <article className={styles.feeCard}>
              <span className={styles.feeLabel}>{t.feeStandardLabel}</span>
              <strong>{t.feeStandardValue}</strong>
            </article>
            <article className={styles.feeCard}>
              <span className={styles.feeLabel}>{t.feeLateLabel}</span>
              <strong>{t.feeLateValue}</strong>
            </article>
          </div>
          <a href="mailto:geral@aamihe.com" className={styles.registerBtn}>
            {t.registerBtn}
          </a>
          <p className={styles.registerNote}>{t.registerNote}</p>
        </div>
      </section>

      <section className={styles.partnersSection}>
        <div className="container">
          <div className={styles.partnersGrid}>
            {CONFERENCIA_PARTNERS.map((partner) => (
              <article key={partner.key} className={styles.partnerCard}>
                <h3>{t.partners[partner.key]}</h3>
                <div className={styles.partnerLogoWrap}>
                  <Image
                    src={partner.image}
                    alt={t.partners[partner.key]}
                    width={partner.width}
                    height={partner.height}
                    className={styles.partnerLogo}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.submissionSection} id="submissao">
        <div className="container">
          <div className={styles.sectionDivider}>
            <span>{t.submissionTitle}</span>
          </div>
          <p className={styles.submissionIntro}>{t.submissionIntro}</p>
          <p className={styles.submissionNote}>{t.submissionNote}</p>

          <div className={styles.formPanel}>
            <ConferenceSubmissionForm labels={t.form} onSubmitted={handleSubmitted} />
          </div>

          <h3 className={styles.publishedTitle}>{t.publishedTitle}</h3>
          <SiteDocumentsList key={refreshKey} category="conferencia" />
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className="container">
          <div className={styles.contactCard}>
            <span className={styles.contactName}>{t.contactName}</span>
            <a href={`mailto:${t.contactEmail}`} className={styles.contactEmail}>
              {t.contactEmail}
            </a>
            <a href="mailto:geral@aamihe.com" className={styles.contactGeneral}>
              geral@aamihe.com
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
