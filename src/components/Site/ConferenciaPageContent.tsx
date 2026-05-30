'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import {
  CONFERENCIA_COPY,
  CONFERENCIA_PARTNERS,
} from '@/data/conferencia-content';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import SiteDocumentsList from '@/components/Site/SiteDocumentsList';
import styles from './ConferenciaPageContent.module.css';

const SUBTHEMES_PREVIEW_COUNT = 3;

export default function ConferenciaPageContent() {
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const [refreshKey, setRefreshKey] = useState(0);
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

  const handleSubmitted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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
                <p>{item.date}</p>
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
