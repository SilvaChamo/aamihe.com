import { CONFERENCIA_COPY, CONFERENCE_SCHEDULE } from '@/data/conferencia-content';

export type ConferenceLocale = 'pt' | 'fr' | 'en';

export type ConferenceTimelineItem = {
  key?: 'submission';
  title: string;
  date: string;
};

const LOCALE_TAGS: Record<ConferenceLocale, string> = {
  pt: 'pt-PT',
  fr: 'fr-FR',
  en: 'en-GB',
};

const DEADLINE_PREFIX: Record<ConferenceLocale, string> = {
  pt: 'Até ',
  fr: "Jusqu'au ",
  en: 'Until ',
};

function parseIsoDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatScheduleDate(iso: string, locale: ConferenceLocale): string {
  return parseIsoDay(iso).toLocaleDateString(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatSubmissionDeadlineEnd(locale: ConferenceLocale): string {
  return `${DEADLINE_PREFIX[locale]}${formatScheduleDate(CONFERENCE_SCHEDULE.submission.endIso, locale)}`;
}

export function formatSubmissionDeadlineStart(locale: ConferenceLocale): string {
  const formatted = formatScheduleDate(CONFERENCE_SCHEDULE.submission.startIso, locale);
  if (locale === 'pt') return `A partir de ${formatted}`;
  if (locale === 'fr') return `À partir du ${formatted}`;
  return `From ${formatted}`;
}

export function getTimelineDisplayDate(
  item: ConferenceTimelineItem,
  locale: ConferenceLocale,
): string {
  if (item.key === 'submission') {
    return formatSubmissionDeadlineEnd(locale);
  }
  return item.date;
}

export function interpolateSubmissionDeadline(text: string, locale: ConferenceLocale): string {
  return text.replace('{deadline}', formatSubmissionDeadlineEnd(locale));
}

export function getLateSubmissionFee(locale: ConferenceLocale): string {
  return CONFERENCE_SCHEDULE.lateSubmissionFee[locale];
}

export function getConferenceFees(locale: ConferenceLocale) {
  const copy = CONFERENCIA_COPY[locale];
  return {
    standardLabel: copy.feeStandardLabel,
    standardValue: copy.feeStandardValue,
    lateLabel: copy.feeLateLabel,
    lateValue: copy.feeLateValue,
    lateSubmissionFee: getLateSubmissionFee(locale),
    contactEmail: copy.contactEmail,
  };
}
