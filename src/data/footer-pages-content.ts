import type { Locale } from '@/i18n/locale';

export type MemberCountry = {
  id: string;
  image?: string;
  flagEmoji?: string;
  name: Record<Locale, string>;
};

export const MEMBER_COUNTRIES: MemberCountry[] = [
  {
    id: 'angola',
    image: '/gallery/paises/Angola-1-300x200.png.webp',
    name: { pt: 'Angola', en: 'Angola', fr: 'Angola' },
  },
  {
    id: 'congo-brazzaville',
    image: '/gallery/paises/Congo-Brazavile-1-300x200.png.webp',
    name: { pt: 'Congo Brazzaville', en: 'Congo Brazzaville', fr: 'Congo Brazzaville' },
  },
  {
    id: 'rdc',
    image: '/gallery/paises/Congo-e1640955995855-1-300x199.png.webp',
    name: {
      pt: 'República Democrática do Congo',
      en: 'Democratic Republic of the Congo',
      fr: 'République Démocratique du Congo',
    },
  },
  {
    id: 'rca',
    image: '/gallery/paises/Centro-AFRICA-1-300x200.png.webp',
    name: {
      pt: 'República Centro-Africana',
      en: 'Central African Republic',
      fr: 'République Centrafricaine',
    },
  },
  {
    id: 'zambia',
    image: '/gallery/paises/ZAMBIA-1-300x200.png.webp',
    name: { pt: 'Zâmbia', en: 'Zambia', fr: 'Zambie' },
  },
  {
    id: 'kenya',
    image: '/gallery/paises/Kenya-1-300x200.png.webp',
    name: { pt: 'Quénia', en: 'Kenya', fr: 'Kenya' },
  },
  {
    id: 'tanzania',
    image: '/gallery/paises/Tanzania-1-300x200.png.webp',
    name: { pt: 'Tanzânia', en: 'Tanzania', fr: 'Tanzanie' },
  },
  {
    id: 'mozambique',
    image: '/gallery/paises/Mozambique-1-300x200.png.webp',
    name: { pt: 'Moçambique', en: 'Mozambique', fr: 'Mozambique' },
  },
  {
    id: 'zimbabwe',
    image: '/gallery/paises/Zimbabwe-1-300x198.png.webp',
    name: { pt: 'Zimbabué', en: 'Zimbabwe', fr: 'Zimbabwe' },
  },
  {
    id: 'south-africa',
    image: '/gallery/paises/Africa-do-Sul-1-300x200.png.webp',
    name: {
      pt: 'República da África do Sul',
      en: 'South Africa',
      fr: 'Afrique du Sud',
    },
  },
  {
    id: 'cote-ivoire',
    image: '/gallery/paises/Cote-dIvoire-300x200.png.webp',
    name: { pt: "Côte d'Ivoire", en: "Côte d'Ivoire", fr: "Côte d'Ivoire" },
  },
  {
    id: 'gambia',
    image: '/gallery/paises/GAMBIA-300x200.png.webp',
    name: { pt: 'Gâmbia', en: 'Gambia', fr: 'Gambie' },
  },
  {
    id: 'ghana',
    image: '/gallery/paises/Ghana-1-300x200.png.webp',
    name: { pt: 'Gana', en: 'Ghana', fr: 'Ghana' },
  },
  {
    id: 'liberia',
    image: '/gallery/paises/Liberia-1-300x158.png.webp',
    name: { pt: 'Libéria', en: 'Liberia', fr: 'Libéria' },
  },
  {
    id: 'nigeria',
    image: '/gallery/paises/Nigeria-1-300x171.png.webp',
    name: { pt: 'Nigéria', en: 'Nigeria', fr: 'Nigeria' },
  },
  {
    id: 'sierra-leone',
    image: '/gallery/paises/Sierra-Leone-1-300x200.png.webp',
    name: { pt: 'Serra Leoa', en: 'Sierra Leone', fr: 'Sierra Leone' },
  },
  {
    id: 'cameroon',
    flagEmoji: '🇨🇲',
    name: { pt: 'Camarões', en: 'Cameroon', fr: 'Cameroun' },
  },
];

export function countryVisual(countryId: string): { image?: string; flagEmoji?: string } {
  const country = MEMBER_COUNTRIES.find((item) => item.id === countryId);
  if (!country) return {};
  return { image: country.image, flagEmoji: country.flagEmoji };
}

export type AffiliatedUniversity = {
  id: string;
  name: Record<Locale, string>;
  countryId: string;
  website?: string;
};

export const AFFILIATED_UNIVERSITIES: AffiliatedUniversity[] = [
  {
    id: 'umum',
    name: {
      pt: 'Universidade Metodista Unida de Moçambique (UMUM)',
      en: 'United Methodist University of Mozambique (UMUM)',
      fr: 'Université Méthodiste Unie du Mozambique (UMUM)',
    },
    countryId: 'mozambique',
    website: 'https://umum.ac.mz/',
  },
  {
    id: 'kemu',
    name: {
      pt: 'Universidade Metodista do Quénia (KeMU)',
      en: 'Kenya Methodist University (KeMU)',
      fr: 'Université Méthodiste du Kenya (KeMU)',
    },
    countryId: 'kenya',
    website: 'https://www.kemu.ac.ke/',
  },
  {
    id: 'umu-liberia',
    name: {
      pt: 'Universidade Metodista Unida (Libéria)',
      en: 'United Methodist University (Liberia)',
      fr: 'Université Méthodiste Unie (Libéria)',
    },
    countryId: 'liberia',
    website: 'https://umu.edu.lr/',
  },
  {
    id: 'umk',
    name: {
      pt: 'Universidade Metodista Unida do Katanga (UMK)',
      en: 'United Methodist University of Katanga (UMK)',
      fr: 'Université Méthodiste Unie du Katanga (UMK)',
    },
    countryId: 'rdc',
    website: 'http://umkmulungwishi.org/',
  },
  {
    id: 'africa-university',
    name: {
      pt: 'Africa University',
      en: 'Africa University',
      fr: 'Africa University',
    },
    countryId: 'zimbabwe',
    website: 'https://www.africau.edu/',
  },
  {
    id: 'umuc',
    name: {
      pt: 'Universidade Metodista Unida do Congo (UMUC)',
      en: 'United Methodist University of Congo (UMUC)',
      fr: 'Université Méthodiste Unie du Congo (UMUC)',
    },
    countryId: 'congo-brazzaville',
  },
];
