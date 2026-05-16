export interface NewsItem {
  id: number;
  date: string;
  title: string;
  image: string;
  category: string;
  author?: string;
  status?: 'published' | 'draft' | 'pending';
}

export const initialNewsData: Record<string, NewsItem[]> = {
  pt: [
    {
      id: 1,
      date: '19 Set, 2024',
      title: 'GoL, UMU, EPA Launch Ocean Acidification Training for West Africa',
      image: '/gallery/Ocean-acidification-training.jpeg.webp',
      category: 'Educação',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 2,
      date: 'Ago, 2024',
      title: 'MASHONALAND EAST DEVELOPMENT PULSE',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Desenvolvimento',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 3,
      date: '25 Abr, 2024',
      title: 'Nota de Falecimento do Rev. Prof. Dr. Kongolo Clement Chijika',
      image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
      category: 'Institucional',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 4,
      date: 'Abr, 2024',
      title: 'Posse Histórica: Universidade Metodista Unida de Moçambique (UMUM) tem novo Reitor',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp', // Placeholder
      category: 'Institucional',
      author: 'Admin',
      status: 'published',
    },
  ],
  fr: [
    {
      id: 1,
      date: '19 Sep, 2024',
      title: 'GoL, UMU, EPA lancent une formation sur l\'acidification des océans pour l\'Afrique de l\'Ouest',
      image: '/gallery/Ocean-acidification-training.jpeg.webp',
      category: 'Éducation',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 2,
      date: 'Août, 2024',
      title: 'MASHONALAND EAST DEVELOPMENT PULSE',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Développement',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 3,
      date: '25 Avr, 2024',
      title: 'Avis de décès : Rev. Prof. Dr Kongolo Clement Chijika',
      image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
      category: 'Institutionnel',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 4,
      date: 'Avr, 2024',
      title: 'Investiture historique : l\'Université Méthodiste Unie du Mozambique (UMUM) a um nouveau Recteur',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Institutionnel',
      author: 'Admin',
      status: 'published',
    },
  ],
  en: [
    {
      id: 1,
      date: 'Sep 19, 2024',
      title: 'GoL, UMU, EPA Launch Ocean Acidification Training for West Africa',
      image: '/gallery/Ocean-acidification-training.jpeg.webp',
      category: 'Education',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 2,
      date: 'Aug, 2024',
      title: 'MASHONALAND EAST DEVELOPMENT PULSE',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Development',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 3,
      date: 'Apr 25, 2024',
      title: 'Death Notice: Rev. Prof. Dr. Kongolo Clement Chijika',
      image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
      category: 'Institutional',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 4,
      date: 'Apr, 2024',
      title: 'Historical Inauguration: United Methodist University of Mozambique (UMUM) has a new Rector',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Institutional',
      author: 'Admin',
      status: 'published',
    },
  ],
};
