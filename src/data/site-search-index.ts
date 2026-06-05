import type { NewsItem } from '@/data/news';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import { boardMembers, boardPresident } from '@/data/board-members';
import { sobreHistoriaCopy } from '@/components/Site/SobreHistoriaIntro';
import { sobreDirectionCopy } from '@/components/Site/SobreDirectionShowcase';
import { sobreOQueFazemosCopy } from '@/components/Site/SobreOQueFazemos';
import { sobreHistoriaSectionCopy } from '@/components/Site/SobreHistoriaSection';
import { homeConferenceCopy } from '@/components/ConferenceSection';
import { homeAboutCopy } from '@/components/AboutSection';
import { homeDirectionCopy } from '@/components/DirectionSection';
import { contactPageCopy } from '@/data/contact-content';
import { DEFAULT_SITE_PAGE_CONFIG } from '@/lib/site-page-config';
import { type SiteSearchChunk, stripHtml } from '@/lib/site-search';

type Locale = 'pt' | 'fr' | 'en';

const SEARCH_SECTION_IMAGES: Record<string, string> = {
  'home-conference': '/gallery/IMG_Bg2.jpg',
  'home-about': '/gallery/sobre-nos-banner.png',
  'home-direcao': boardPresident.image,
  'conf-banner': '/gallery/IMG_Bg2.jpg',
  'conf-theme': '/gallery/IMG_Bg2.jpg',
  'conf-fees': '/gallery/IMG_Bg2.jpg',
  'conf-submission': '/gallery/IMG_Bg2.jpg',
  'conf-contact': '/gallery/IMG_Bg2.jpg',
  'sobre-historia': '/gallery/sobre-nos-banner.png',
  'sobre-direcao': boardPresident.image,
  'sobre-fazemos': '/gallery/Bg_serv.webp',
  'sobre-estatutos': '/gallery/sobre-nos-banner.png',
  contact: DEFAULT_SITE_PAGE_CONFIG.contact.bannerImage,
};

function sectionImageFor(id: string): string | undefined {
  if (SEARCH_SECTION_IMAGES[id]) return SEARCH_SECTION_IMAGES[id];
  if (id.startsWith('conf-')) return '/gallery/IMG_Bg2.jpg';
  return undefined;
}

function joinParts(parts: Array<string | undefined | null>): string {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(' ');
}

function pushChunk(
  chunks: SiteSearchChunk[],
  id: string,
  href: string,
  title: string,
  parts: Array<string | undefined | null>,
  options?: { image?: string; summary?: string },
) {
  const body = joinParts(parts);
  if (!body.trim()) return;
  chunks.push({
    id,
    href,
    title,
    body,
    image: options?.image,
    summary: options?.summary,
  });
}

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, acc));
    return acc;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, acc));
  }
  return acc;
}

export function buildSiteSearchIndex(locale: Locale, news: NewsItem[]): SiteSearchChunk[] {
  const chunks: SiteSearchChunk[] = [];
  const conf = CONFERENCIA_COPY[locale];
  const historia = sobreHistoriaCopy[locale];
  const direcao = sobreDirectionCopy[locale];
  const fazemos = sobreOQueFazemosCopy[locale];
  const estatutos = sobreHistoriaSectionCopy[locale];
  const homeConf = homeConferenceCopy[locale];
  const homeAbout = homeAboutCopy[locale];
  const homeDir = homeDirectionCopy[locale];
  const contact = contactPageCopy[locale];

  pushChunk(
    chunks,
    'home-conference',
    '/#conferencia',
    homeConf.title,
    [homeConf.subtitle, homeConf.text, homeConf.date_label, homeConf.date, homeConf.location],
    { image: sectionImageFor('home-conference') },
  );

  pushChunk(
    chunks,
    'home-about',
    '/#sobre-nos',
    homeAbout.sobre_title,
    [homeAbout.sobre_text, homeAbout.missao_title, homeAbout.missao_text],
    { image: sectionImageFor('home-about') },
  );

  pushChunk(
    chunks,
    'home-direcao',
    '/#direcao',
    homeDir.title,
    [homeDir.subtitle, ...boardMembers.map((m) => joinParts([m.name, m.role[locale]]))],
    { image: sectionImageFor('home-direcao') },
  );

  pushChunk(
    chunks,
    'conf-banner',
    '/conferencia',
    conf.date,
    [conf.dateTitle, conf.date, conf.venue, ...conf.intro],
    { image: sectionImageFor('conf-banner') },
  );

  pushChunk(
    chunks,
    'conf-theme',
    '/conferencia',
    conf.themeLabel,
    [conf.themeTitle, conf.themeNumber],
    { image: sectionImageFor('conf-theme') },
  );

  conf.subthemes.forEach((subtheme, index) => {
    pushChunk(chunks, `conf-subtheme-${index}`, '/conferencia', conf.subthemesTitle, [subtheme], {
      image: sectionImageFor(`conf-subtheme-${index}`),
    });
  });

  conf.timeline.forEach((item, index) => {
    pushChunk(
      chunks,
      `conf-timeline-${index}`,
      '/conferencia',
      item.title,
      [item.date, conf.planTitlePrefix, conf.planTitleBold],
      {
        image: sectionImageFor(`conf-timeline-${index}`),
      },
    );
  });

  pushChunk(
    chunks,
    'conf-fees',
    '/conferencia',
    conf.feesTitle,
    [
      conf.feesEyebrow,
      conf.feesIntro,
      conf.feeStandardLabel,
      conf.feeStandardValue,
      conf.feeLateLabel,
      conf.feeLateValue,
      conf.registerNote,
    ],
    { image: sectionImageFor('conf-fees') },
  );

  pushChunk(
    chunks,
    'conf-submission',
    '/conferencia#submissao',
    conf.submissionTitle,
    [conf.submissionHeroIntro, conf.submissionIntro, collectStrings(conf.form).join(' ')],
    { image: sectionImageFor('conf-submission') },
  );

  pushChunk(chunks, 'conf-contact', '/conferencia', conf.contactName, [conf.contactEmail], {
    image: sectionImageFor('conf-contact'),
  });

  pushChunk(
    chunks,
    'sobre-historia',
    '/sobre-nos#sobre-historia',
    historia.title,
    [historia.eyebrow, historia.intro, historia.origin, historia.event, historia.workshops],
    { image: sectionImageFor('sobre-historia') },
  );

  pushChunk(
    chunks,
    'sobre-direcao',
    '/sobre-nos#organograma',
    direcao.orgTitle,
    [
      direcao.orgEyebrow,
      direcao.orgSubtitle,
      boardPresident.name,
      boardPresident.role[locale],
      boardPresident.language?.[locale],
      boardPresident.bio?.[locale],
      ...boardMembers.flatMap((member) => [
        member.name,
        member.role[locale],
        member.language?.[locale],
        member.bio?.[locale],
      ]),
    ],
    { image: sectionImageFor('sobre-direcao') },
  );

  pushChunk(
    chunks,
    'sobre-fazemos',
    '/sobre-nos#sobre-o-que-fazemos',
    fazemos.title,
    [fazemos.eyebrow, fazemos.text, fazemos.partnersTitle],
    { image: sectionImageFor('sobre-fazemos') },
  );

  pushChunk(
    chunks,
    'sobre-estatutos',
    '/sobre-nos#sobre-estatutos',
    estatutos.statutesTitle,
    [estatutos.statutesIntro, ...estatutos.statutes.map((doc) => joinParts([doc.label, doc.lang]))],
    { image: sectionImageFor('sobre-estatutos') },
  );

  pushChunk(
    chunks,
    'contact',
    '/contacte-nos',
    contact.formTitle,
    [
      contact.firstName,
      contact.lastName,
      contact.message,
      contact.success,
      'geral@aamihe.com',
      'Rua da Sé nº 114, Pestana Rovuma Hotel',
    ],
    { image: sectionImageFor('contact') },
  );

  const published = news.filter((item) => item.status !== 'draft');
  published.forEach((item) => {
    const localized =
      locale === 'pt'
        ? item
        : {
            ...item,
            title: item.translations?.[locale]?.title ?? item.title,
            content: item.translations?.[locale]?.content ?? item.content,
            summary: item.translations?.[locale]?.summary ?? item.summary,
          };

    const summaryText =
      localized.summary?.trim() ||
      stripHtml(localized.content).slice(0, 240);

    const contentPlain = stripHtml(localized.content);

    pushChunk(
      chunks,
      `news-${item.id}`,
      `/noticias/${item.id}`,
      localized.title,
      [
        localized.title,
        localized.category,
        summaryText,
        contentPlain,
        localized.author,
        localized.date,
      ],
      { image: localized.image, summary: summaryText },
    );
  });

  return chunks;
}
