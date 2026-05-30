'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import {
  CONFERENCIA_COPY,
  CONFERENCIA_PARTNER_LOGOS,
  CONFERENCIA_PARTNER_TITLES,
} from '@/data/conferencia-content';
import { getTimelineDisplayDate, interpolateSubmissionDeadline } from '@/lib/conference-schedule';
import ConferenceParticipantRegisterForm from '@/components/Site/ConferenceParticipantRegisterForm';
import styles from './ConferenciaPageContent.module.css';

const SUBTHEMES_PREVIEW_COUNT = 3;

export default function ConferenciaPageContent() {
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const [subthemesModalOpen, setSubthemesModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const previewSubthemes = t.subthemes.slice(0, SUBTHEMES_PREVIEW_COUNT);
  const moreSubthemes = t.subthemes.slice(SUBTHEMES_PREVIEW_COUNT);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!subthemesModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSubthemesModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [subthemesModalOpen]);

  const closeSubthemesModal = useCallback(() => {
    setSubthemesModalOpen(false);
  }, []);

  return (
    <>
      <section className={styles.subthemesSection}>
        <div className="container">
          <div className={styles.subthemesGrid}>
            {previewSubthemes.map((item, index) => (
              <article key={item} className={styles.subthemeCard}>
                <span className={styles.subthemeIndex}>{index + 1}</span>
                <p>{item}</p>
              </article>
            ))}
          </div>
          {moreSubthemes.length > 0 ? (
            <div className={styles.subthemesActions}>
              <button
                type="button"
                className={styles.subthemesShowAllBtn}
                onClick={() => setSubthemesModalOpen(true)}
              >
                {t.subthemesShowAll}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {mounted && subthemesModalOpen
        ? createPortal(
            <div
              className={styles.subthemesModalOverlay}
              onClick={closeSubthemesModal}
              role="presentation"
            >
              <div
                className={styles.subthemesModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="conferencia-subthemes-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className={styles.subthemesModalHeader}>
                  <h3 id="conferencia-subthemes-modal-title" className={styles.subthemesModalTitle}>
                    {t.subthemesModalTitle}
                  </h3>
                  <button
                    type="button"
                    className={styles.subthemesModalClose}
                    onClick={closeSubthemesModal}
                    aria-label={t.subthemesModalClose}
                  >
                    ×
                  </button>
                </header>
                <div className={styles.subthemesModalTableWrap}>
                  <table className={styles.subthemesModalTable}>
                    <tbody>
                      {moreSubthemes.map((item, index) => (
                        <tr key={item} className={styles.subthemesModalRow}>
                          <td className={styles.subthemesModalNum}>
                            {SUBTHEMES_PREVIEW_COUNT + index + 1}
                          </td>
                          <td className={styles.subthemesModalText}>{item}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <section className={styles.planSection}>
        <div className="container">
          <div className={styles.planHeader}>
            <h2 className={styles.planTitle}>
              {t.planTitlePrefix}
              <strong>{t.planTitleBold}</strong>
            </h2>
            <div className={styles.planLine} />
          </div>
          <div className={styles.timelineGrid}>
            {t.timeline.map((item) => (
              <article key={item.title} className={styles.timelineCard}>
                <h3>{item.title}</h3>
                <p>{getTimelineDisplayDate(item, locale)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.feesSection}>
        <div className="container">
          <div className={styles.feesLayout}>
            <div className={styles.feesVisual}>
              <Image
                src="/images/conferencia-inscricao-african.jpg"
                alt={t.feesImageAlt}
                fill
                className={styles.feesImage}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className={styles.feesContentCol}>
              <div className={styles.feesContent}>
                <div className={styles.feesHeader}>
                  <span className={styles.feesHeaderRule} aria-hidden="true" />
                  <div className={styles.feesHeaderText}>
                    <p className={styles.feesEyebrow}>
                      <span className={styles.feesEyebrowDash} aria-hidden="true" />
                      {t.feesEyebrow}
                    </p>
                    <h2 className={styles.feesTitle}>{t.feesTitle}</h2>
                    <p className={styles.feesIntro}>
                      {t.feesIntro} {t.registerNote}
                    </p>
                  </div>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.partnersSection} aria-label={t.partners.organization}>
        <div className="container">
          <div className={styles.partnersLayout}>
            <div className={styles.partnersTitlesRow}>
              {CONFERENCIA_PARTNER_TITLES.map((title) => (
                <p
                  key={title.key}
                  className={`site-eyebrow ${styles.partnerLabel} ${
                    title.span === 2 ? styles.partnerTitleSpan2 : ''
                  }`}
                >
                  <span className="site-eyebrow-dash" aria-hidden="true" />
                  {t.partners[title.key]}
                  <span className="site-eyebrow-dash" aria-hidden="true" />
                </p>
              ))}
            </div>
            <div className={styles.partnersLogosRow}>
              {CONFERENCIA_PARTNER_LOGOS.map((logo) => (
                <div key={logo.alt} className={styles.partnerLogoWrap}>
                  <Image
                    src={logo.image}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    className={styles.partnerLogo}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.submissionSection} id="submissao">
        <div className="container">
          <div className={styles.submissionLayout}>
            <div className={styles.submissionHeroCol}>
              <span className={styles.submissionHeroAccent} aria-hidden="true" />
              <h2 className={styles.submissionHeroTitle}>
                {t.submissionHeroTitleLine1}
                <br />
                {t.submissionHeroTitleLine2}
              </h2>
              <p className={styles.submissionHeroIntro}>
                {interpolateSubmissionDeadline(t.submissionHeroIntro, locale)}
              </p>
              <a href="#registo-conferencia" className={styles.submissionCtaBtn}>
                {t.submissionCtaBtn}
                <span className={styles.submissionCtaIcon} aria-hidden="true">
                  ›
                </span>
              </a>
            </div>

            <div id="registo-conferencia" className={styles.submissionFormCol}>
              <div className={styles.formPanel}>
                <ConferenceParticipantRegisterForm labels={t.registerForm} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
