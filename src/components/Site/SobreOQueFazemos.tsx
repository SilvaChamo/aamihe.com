'use client';

import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SobreOQueFazemos.module.css';

export const sobreOQueFazemosCopy = {
  pt: {
    eyebrow: 'O que fazemos',
    title: 'Serviços da AAMIHE',
    subtitle: 'Cooperação, intercâmbio e qualidade no ensino superior metodista em África',
    paragraph1:
      'A AAMIHE promove a relação, o intercâmbio e a cooperação entre instituições de ensino superior metodistas em África, recolhendo e divulgando informações sobre ensino, investigação e serviços. Apoia o desenvolvimento curricular, a pós-graduação, a investigação e a garantia de qualidade, respondendo às necessidades curriculares e educativas das universidades metodistas e coordenando os meios para as satisfazer.',
    paragraph2:
      'Organiza fóruns de divulgação, intercâmbio e diálogo político, promovendo a igualdade de género e a igualdade social nas políticas de ensino superior. Mantém vínculos com a comunidade metodista internacional de ensino superior, em cooperação com:',
    partnersTitle: 'Parceiros internacionais',
  },
  en: {
    eyebrow: 'What we do',
    title: 'AAMIHE services',
    subtitle: 'Cooperation, exchange and quality in Methodist higher education across Africa',
    paragraph1:
      'AAMIHE fosters relationships, exchange and cooperation among Methodist higher education institutions in Africa, collecting and sharing information on teaching, research and services. It supports curriculum development, postgraduate education, research and quality assurance, responding to the curricular and educational needs of Methodist universities and coordinating the means to meet them.',
    paragraph2:
      'It organizes forums for dissemination, exchange and policy dialogue, promoting gender equality and social equality in higher education policies. It maintains links with the international Methodist higher education community through cooperation with:',
    partnersTitle: 'International partners',
  },
  fr: {
    eyebrow: 'Ce que nous faisons',
    title: 'Services de l’AAMIHE',
    subtitle: 'Coopération, échange et qualité dans l’enseignement supérieur méthodiste en Afrique',
    paragraph1:
      "L'AAMIHE promeut la relation, l'échange et la coopération entre les institutions d'enseignement supérieur méthodistes en Afrique, en recueillant et diffusant des informations sur l'enseignement, la recherche et les services. Elle soutient le développement curriculaire, les études post-universitaires, la recherche et l'assurance qualité, en répondant aux besoins curriculaires et éducatifs des universités méthodistes et en coordonnant les moyens pour y répondre.",
    paragraph2:
      "Elle organise des forums de diffusion, d'échange et de dialogue politique, en promouvant l'égalité de genre et l'égalité sociale dans les politiques d'enseignement supérieur. Elle entretient des liens avec la communauté méthodiste internationale de l'enseignement supérieur, en coopération avec :",
    partnersTitle: 'Partenaires internationaux',
  },
} as const;

const PARTNERS = [
  {
    id: 'aaitimu',
    logo: null,
    abbr: 'AAITIMU',
    description: {
      pt: 'Associação Africana de Instituições Teológicas da Igreja Metodista Unida',
      en: 'African Association of United Methodist Theological Institutions',
      fr: 'Association Africaine des Institutions Théologiques de l’Église Méthodiste Unie',
    },
  },
  {
    id: 'iamscu',
    logo: '/images/iamscu-logo.webp',
    abbr: 'IAMSCU',
  },
  {
    id: 'gbhem',
    logo: '/images/GBHEM.webp',
    abbr: 'GBHEM',
  },
] as const;

export default function SobreOQueFazemos() {
  const { locale } = useLanguage();
  const t = sobreOQueFazemosCopy[locale];

  return (
    <section id="sobre-o-que-fazemos" className={styles.section} aria-labelledby="sobre-o-que-fazemos-titulo">
      <div className={styles.inner}>
        <span className={`site-eyebrow ${styles.eyebrow}`}>
          <span className="site-eyebrow-dash" aria-hidden="true" />
          {t.eyebrow}
          <span className="site-eyebrow-dash" aria-hidden="true" />
        </span>
        <h2 id="sobre-o-que-fazemos-titulo" className={styles.title}>
          {t.title}
        </h2>
        <p className={styles.subtitle}>{t.subtitle}</p>
        <div className={styles.body}>
          <p className={styles.paragraph}>{t.paragraph1}</p>
          <p className={styles.paragraph}>{t.paragraph2}</p>
        </div>

        <div className={styles.partners} aria-label={t.partnersTitle}>
          <ul className={styles.partnerGrid}>
            {PARTNERS.map((partner) => (
              <li key={partner.id} className={styles.partnerCard}>
                <div
                  className={`${styles.partnerCardInner} ${
                    partner.id === 'aaitimu' ? styles.partnerCardInnerText : ''
                  }`}
                >
                  {partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={partner.abbr}
                      width={220}
                      height={72}
                      className={styles.partnerLogo}
                    />
                  ) : (
                    <>
                      <span className={styles.partnerAbbr}>{partner.abbr}</span>
                      {'description' in partner && partner.description ? (
                        <p className={styles.partnerDesc}>{partner.description[locale]}</p>
                      ) : null}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
