import type { NewsItem } from '@/data/news';

/**
 * Catálogo canónico importado de home-aamihe.html + Blog.html + post.html (site estático).
 * Usado como fallback e para bootstrap do Supabase quando a base está vazia.
 */
export const newsCatalog: NewsItem[] = [
  {
    id: 1,
    date: '19 Set, 2024',
    title: 'GoL, UMU e EPA lançam formação sobre acidificação dos oceanos na África Ocidental',
    image: '/gallery/Ocean-acidification-training.jpeg.webp',
    category: 'Educação',
    summary: 'Parceria entre instituições para formação sobre acidificação dos oceanos na região.',
    content: `<p><strong>MONROVIA –</strong> Uma formação de uma semana sobre acidificação dos oceanos começou hoje, reunindo participantes da Libéria, Gana, Costa do Marfim e outras nações da África Ocidental. A formação, realizada no Belle Casa Hotel em Monróvia, visa reforçar capacidades e partilhar conhecimentos sobre os impactos das alterações climáticas nos ecossistemas marinhos.</p>
<p>A Universidade Metodista Unida (UMU), em colaboração com o Governo da Libéria (GoL) e a Agência de Proteção Ambiental (EPA), coordena este programa regional que reúne especialistas, investigadores e gestores ambientais para debater estratégias de monitorização, mitigação e adaptação.</p>
<p>Os participantes irão analisar dados científicos recentes, partilhar experiências nacionais e definir recomendações para políticas públicas que protejam as comunidades costeiras e a biodiversidade marinha face à acidificação crescente dos oceanos.</p>`,
    author: 'Admin',
    status: 'published',
  },
  {
    id: 2,
    date: 'Ago, 2024',
    title: 'Impulso de desenvolvimento em Mashonaland East',
    image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
    category: 'Desenvolvimento',
    summary: 'Atualização sobre desenvolvimento e iniciativas na região.',
    content: `<p>A região de Mashonaland East regista avanços significativos em projetos de desenvolvimento comunitário, educação e infraestruturas básicas, com impacto directo nas populações rurais e urbanas.</p>
<p>As iniciativas em curso incluem programas de capacitação profissional, apoio à agricultura familiar e reforço de serviços sociais, em articulação com parceiros institucionais e autoridades locais.</p>
<p>A AAMIHE destaca a importância de modelos de desenvolvimento sustentável que integrem formação, investigação aplicada e participação das comunidades, garantindo resultados duradouros para as gerações futuras.</p>`,
    author: 'Admin',
    status: 'published',
  },
  {
    id: 3,
    date: '25 Abr, 2024',
    title: 'Nota de Falecimento do Rev. Prof. Dr. Kongolo Clement Chijika',
    image: '/gallery/President-Kongolo-Chijika-1.jpg.webp',
    category: 'Institucional',
    summary: 'Comunicado à comunidade académica e aos membros da associação.',
    content: `<p>É com profundo pesar que a AAMIHE comunica o falecimento do Rev. Prof. Dr. Kongolo Clement Chijika, figura central na história da nossa instituição e referência para a comunidade académica metodista em África.</p>
<p>O Rev. Prof. Dr. Kongolo dedicou décadas ao ensino superior, à liderança institucional e ao serviço público, contribuindo de forma decisiva para o fortalecimento das universidades metodistas e para a consolidação dos valores de excelência, integridade e serviço.</p>
<p>Neste momento de luto, a AAMIHE presta homenagem à sua memória e estende as mais sinceras condolências à família, aos colegas, estudantes e a todos quantos foram tocados pelo seu legado.</p>`,
    author: 'Admin',
    status: 'published',
  },
  {
    id: 4,
    date: 'Abr, 2024',
    title: 'Posse Histórica: Universidade Metodista Unida de Moçambique (UMUM) tem novo Reitor',
    image: '/gallery/bed4c6ab-bf65-48aa-9d9d-61de5d50f21a.jpeg.webp',
    category: 'Institucional',
    summary: 'Cobertura do evento e do percurso da instituição.',
    content: `<p>A Universidade Metodista Unida de Moçambique (UMUM) celebrou a tomada de posse do seu novo Reitor, marcando um novo capítulo para a instituição e para o ensino superior metodista no país.</p>
<p>A cerimónia reuniu autoridades académicas, representantes eclesiásticos, parceiros nacionais e internacionais, sublinhando o compromisso da UMUM com a qualidade académica, a inovação pedagógica e o serviço à sociedade.</p>
<p>A AAMIHE felicita a UMUM e o novo Reitor, reafirmando o apoio da associação às instituições filiadas na promoção de formação de excelência e no desenvolvimento sustentável das comunidades.</p>`,
    author: 'Admin',
    status: 'published',
  },
];
