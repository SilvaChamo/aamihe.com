import { siteGalleryImage } from '@/lib/site-gallery-image';

export type BoardMember = {
  name: string;
  role: { pt: string; en: string; fr: string };
  image: string;
  language?: { pt: string; en: string; fr: string };
  bio?: { pt: string; en: string; fr: string };
};

export const boardPresident: BoardMember = {
  name: 'Rosemary Nyarugwe',
  role: { pt: 'Presidente', en: 'President', fr: 'Présidente' },
  image: siteGalleryImage('/gallery/Vice-President-Anglophone-Rosemary.jpg.webp'),
  language: { pt: 'Grupo anglófono', en: 'Anglophone group', fr: 'Groupe anglophone' },
  bio: {
    pt: 'Lidera a AAMIHE na promoção da cooperação entre instituições metodistas de ensino superior em África, fortalecendo a educação e o impacto transformador no continente.',
    en: 'She leads AAMIHE in promoting cooperation among Methodist higher education institutions across Africa, strengthening education and transformative impact on the continent.',
    fr: "Elle dirige l'AAMIHE en favorisant la coopération entre les institutions méthodistes d'enseignement supérieur en Afrique.",
  },
};

export const boardMembers: BoardMember[] = [
  {
    name: 'Tiago Mutombo',
    role: { pt: 'Vice-Presidente', en: 'Vice-President', fr: 'Vice-Président' },
    image: siteGalleryImage('/gallery/3-Tiago-Caungo-Mutombo-Vice-President-Lusophone-compressed-scaled.jpg.webp'),
    language: { pt: 'Português', en: 'Portuguese', fr: 'Portugais' },
  },
  {
    name: 'René Gnalega',
    role: { pt: 'Vice-Presidente', en: 'Vice-President', fr: 'Vice-Président' },
    image: siteGalleryImage('/gallery/4-Rene-Gnalega-Vice-President-Francophone-compressed-scaled.jpg.webp'),
    language: { pt: 'Francês', en: 'French', fr: 'Français' },
  },
  {
    name: 'Yar Gonway-Gono',
    role: { pt: 'Vice-Presidente', en: 'Vice-President', fr: 'Vice-Présidente' },
    image: siteGalleryImage('/gallery/5-Yar-Donlah-Gonway-Gono-Vice-President-Anglophone-compressed-scaled.jpg.webp'),
    language: { pt: 'Inglês', en: 'English', fr: 'Anglais' },
  },
  {
    name: 'Peter Mageto',
    role: { pt: 'Secretário', en: 'Secretary', fr: 'Secrétaire' },
    image: siteGalleryImage('/gallery/6-Peter-Mageto-Secretary-compressed-scaled.jpg.webp'),
  },
  {
    name: 'Jamisse Taimo',
    role: { pt: 'Director Executivo', en: 'Executive Officer', fr: 'Directeur Exécutif' },
    image: siteGalleryImage('/gallery/7-Jamisse-Taimo-Consultants-Executive-Officer-compressed-scaled.jpg.webp'),
  },
  {
    name: 'Tukumbi Lumumba',
    role: { pt: 'Consultor', en: 'Consultant', fr: 'Consultant' },
    image: siteGalleryImage('/gallery/9-Tukumbi-Lumumba-Kasongo-Consultants-compressed-scaled.jpg.webp'),
  },
];
