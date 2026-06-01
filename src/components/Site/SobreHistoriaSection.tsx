'use client';

import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SobreHistoriaSection.module.css';

const PDF_ICON_URL =
  'https://supabase.aamihe.com/storage/v1/object/public/aamihe-media/legacy/ref/Documentos%20gerais_files/PDF-1-1.png.webp';

export const sobreHistoriaSectionCopy = {
  pt: {
    statutesTitle: 'Estatutos e constituição',
    statutesIntro: 'Documentos oficiais da associação nas três línguas de trabalho.',
    downloadLabel: 'Descarregar',
    statutes: [
      {
        label: 'AAMIHE Estatuto',
        lang: 'Português',
        href: '/estatutos/AAIMES-Constituicao.pdf',
      },
      {
        label: 'AAMIHE Constitution',
        lang: 'English',
        href: '/estatutos/AAMIHE-Constitution.pdf',
      },
      {
        label: 'AAMIHE Constitution',
        lang: 'Français',
        href: '/estatutos/AAIMES-Constitution.pdf',
      },
    ],
  },
  en: {
    statutesTitle: 'Constitution and bylaws',
    statutesIntro: 'Official association documents in all three working languages.',
    downloadLabel: 'Download',
    statutes: [
      {
        label: 'AAMIHE Estatuto',
        lang: 'Portuguese',
        href: '/estatutos/AAIMES-Constituicao.pdf',
      },
      {
        label: 'AAMIHE Constitution',
        lang: 'English',
        href: '/estatutos/AAMIHE-Constitution.pdf',
      },
      {
        label: 'AAMIHE Constitution',
        lang: 'French',
        href: '/estatutos/AAIMES-Constitution.pdf',
      },
    ],
  },
  fr: {
    statutesTitle: 'Statuts et constitution',
    statutesIntro: 'Documents officiels de l’association dans les trois langues de travail.',
    downloadLabel: 'Télécharger',
    statutes: [
      {
        label: 'AAMIHE Estatuto',
        lang: 'Portugais',
        href: '/estatutos/AAIMES-Constituicao.pdf',
      },
      {
        label: 'AAMIHE Constitution',
        lang: 'Anglais',
        href: '/estatutos/AAMIHE-Constitution.pdf',
      },
      {
        label: 'AAMIHE Constitution',
        lang: 'Français',
        href: '/estatutos/AAIMES-Constitution.pdf',
      },
    ],
  },
} as const;

export default function SobreHistoriaSection() {
  const { locale } = useLanguage();
  const t = sobreHistoriaSectionCopy[locale];

  return (
    <section className={styles.section} aria-labelledby="sobre-estatutos-titulo">
      <div id="sobre-estatutos" className={styles.statutesPanel}>
        <div className={styles.statutesInner}>
          <div className={styles.statutesHeader}>
            <h2 id="sobre-estatutos-titulo" className={styles.statutesTitle}>
              {t.statutesTitle}
            </h2>
            <p className={styles.statutesIntro}>{t.statutesIntro}</p>
          </div>
          <ul className={styles.pdfGrid}>
            {t.statutes.map((doc) => (
              <li key={`${doc.href}-${doc.lang}`}>
                <a
                  href={doc.href}
                  className={styles.pdfCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${doc.label} — ${doc.lang} — ${t.downloadLabel}`}
                >
                  <span className={styles.pdfIconWrap}>
                    <Image
                      src={PDF_ICON_URL}
                      alt=""
                      width={36}
                      height={36}
                      className={styles.pdfIconImg}
                      aria-hidden="true"
                    />
                  </span>
                  <span className={styles.pdfContent}>
                    <span className={styles.pdfLabel}>{doc.label}</span>
                    <span className={styles.pdfMetaRow}>
                      <span className={styles.pdfLang}>{doc.lang}</span>
                      <span className={styles.pdfCta}>{t.downloadLabel}</span>
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
