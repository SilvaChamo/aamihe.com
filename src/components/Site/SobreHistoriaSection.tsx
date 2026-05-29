'use client';

import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SobreHistoriaSection.module.css';

const PDF_ICON_URL =
  'https://gwankhxcbkrtgxopbxwd.supabase.co/storage/v1/object/public/aamihe-media/legacy/ref/Documentos%20gerais_files/PDF-1-1.png.webp';

const COPY = {
  pt: {
    statutesTitle: 'Estatutos e constituição',
    statutesIntro: 'Consulte ou descarregue os documentos oficiais da associação nas três línguas de trabalho.',
    download: 'Descarregar PDF',
    statutes: [
      { label: 'AAMIHE Estatuto', sub: 'Português', href: '/estatutos/AAIMES-Constituicao.pdf' },
      { label: 'AAMIHE Constitution', sub: 'English', href: '/estatutos/AAMIHE-Constitution.pdf' },
      { label: 'AAMIHE Constitution', sub: 'Français', href: '/estatutos/AAIMES-Constitution.pdf' },
    ],
  },
  en: {
    statutesTitle: 'Constitution and bylaws',
    statutesIntro: 'View or download the association’s official documents in each working language.',
    download: 'Download PDF',
    statutes: [
      { label: 'AAMIHE Estatuto', sub: 'Portuguese', href: '/estatutos/AAIMES-Constituicao.pdf' },
      { label: 'AAMIHE Constitution', sub: 'English', href: '/estatutos/AAMIHE-Constitution.pdf' },
      { label: 'AAMIHE Constitution', sub: 'French', href: '/estatutos/AAIMES-Constitution.pdf' },
    ],
  },
  fr: {
    statutesTitle: 'Statuts et constitution',
    statutesIntro: 'Consultez ou téléchargez les documents officiels de l’association dans chaque langue de travail.',
    download: 'Télécharger le PDF',
    statutes: [
      { label: 'AAMIHE Estatuto', sub: 'Portugais', href: '/estatutos/AAIMES-Constituicao.pdf' },
      { label: 'AAMIHE Constitution', sub: 'Anglais', href: '/estatutos/AAMIHE-Constitution.pdf' },
      { label: 'AAMIHE Constitution', sub: 'Français', href: '/estatutos/AAIMES-Constitution.pdf' },
    ],
  },
} as const;

export default function SobreHistoriaSection() {
  const { locale } = useLanguage();
  const t = COPY[locale];

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
              <li key={`${doc.href}-${doc.sub}`}>
                <a
                  href={doc.href}
                  className={styles.pdfCard}
                  target="_blank"
                  rel="noopener noreferrer"
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
                  <span className={styles.pdfBody}>
                    <span className={styles.pdfLabel}>{doc.label}</span>
                    <span className={styles.pdfLang}>{doc.sub}</span>
                  </span>
                  <span className={styles.pdfCta}>{t.download}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
