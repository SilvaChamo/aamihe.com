export interface NewsItem {
  id: number;
  date: string;
  title: string;
  image: string;
  category: string;
  content: string;
  summary?: string;
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
      content: 'A Universidade Metodista Unida (UMU), em colaboração com o Governo da Libéria (GoL) e a Agência de Proteção Ambiental (EPA), lançou um programa de formação sobre acidificação dos oceanos para a África Ocidental...',
      summary: 'Formação regional sobre o impacto climático nos oceanos.',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 2,
      date: 'Ago, 2024',
      title: 'MASHONALAND EAST DEVELOPMENT PULSE',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Desenvolvimento',
      content: 'Relatório detalhado sobre os avanços no desenvolvimento regional em Mashonaland East...',
      summary: 'Destaques do desenvolvimento regional.',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 3,
      date: '25 Abr, 2024',
      title: 'Nota de Falecimento do Rev. Prof. Dr. Kongolo Clement Chijika',
      image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
      category: 'Institucional',
      content: 'É com profundo pesar que a AAMIHE comunica o falecimento do Rev. Prof. Dr. Kongolo Clement Chijika, uma figura central na nossa instituição...',
      summary: 'Homenagem póstuma ao Rev. Prof. Dr. Kongolo.',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 4,
      date: 'Abr, 2024',
      title: 'Posse Histórica: Universidade Metodista Unida de Moçambique (UMUM) tem novo Reitor',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Institucional',
      content: 'A Universidade Metodista Unida de Moçambique celebrou a tomada de posse do seu novo Reitor, marcando um novo capítulo para a instituição...',
      summary: 'Cerimónia oficial de posse na UMUM.',
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
      content: 'L\'Université Méthodiste Unie (UMU), en collaboration avec le Gouvernement du Libéria (GoL) et l\'Agence de Protection de l\'Environnement (EPA), a lancé un programme de formation...',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 2,
      date: 'Août, 2024',
      title: 'IMPULSION DE DÉVELOPPEMENT DE MASHONALAND EAST',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Développement',
      content: 'Rapport détaillé sur les progrès du développement régional à Mashonaland East...',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 3,
      date: '25 Avr, 2024',
      title: 'Avis de décès du Rev. Prof. Dr. Kongolo Clement Chijika',
      image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
      category: 'Institutionnel',
      content: 'C\'est avec une profonde tristesse que l\'AAMIHE annonce le décès du Rev. Prof. Dr. Kongolo Clement Chijika...',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 4,
      date: 'Avr, 2024',
      title: 'Investiture historique : l\'Université Méthodiste Unie du Mozambique (UMUM) a um nouveau recteur',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Institutionnel',
      content: 'L\'Université Méthodiste Unie du Mozambique a célébré l\'investiture de seu nouveau recteur...',
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
      content: 'United Methodist University (UMU), in collaboration with the Government of Liberia (GoL) and the Environmental Protection Agency (EPA), launched a training program...',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 2,
      date: 'Aug, 2024',
      title: 'MASHONALAND EAST DEVELOPMENT PULSE',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Development',
      content: 'Detailed report on regional development progress in Mashonaland East...',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 3,
      date: 'Apr 25, 2024',
      title: 'Obituary: Rev. Prof. Dr. Kongolo Clement Chijika',
      image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
      category: 'Institutional',
      content: 'It is with deep sorrow that AAMIHE announces the passing of Rev. Prof. Dr. Kongolo Clement Chijika...',
      author: 'Admin',
      status: 'published',
    },
    {
      id: 4,
      date: 'Apr, 2024',
      title: 'Historic Inauguration: United Methodist University of Mozambique (UMUM) has a new Rector',
      image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
      category: 'Institutional',
      content: 'The United Methodist University of Mozambique celebrated the inauguration of its new Rector...',
      author: 'Admin',
      status: 'published',
    },
  ],
};
