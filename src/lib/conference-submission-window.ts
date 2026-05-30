import { CONFERENCE_SCHEDULE } from '@/data/conferencia-content';

export type SubmissionPeriodStatus = 'not_started' | 'open' | 'closed';

export type SubmissionPeriodReport = {
  status: SubmissionPeriodStatus;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  daysOverdue: number;
  isAcceptable: boolean;
};

function parseDayStart(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function parseDayEnd(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function diffDaysCeil(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function getSubmissionPeriodReport(now = new Date()): SubmissionPeriodReport {
  const startDate = parseDayStart(CONFERENCE_SCHEDULE.submission.startIso);
  const endDate = parseDayEnd(CONFERENCE_SCHEDULE.submission.endIso);

  if (now < startDate) {
    return {
      status: 'not_started',
      startDate,
      endDate,
      daysRemaining: diffDaysCeil(now, startDate),
      daysOverdue: 0,
      isAcceptable: false,
    };
  }

  if (now > endDate) {
    return {
      status: 'closed',
      startDate,
      endDate,
      daysRemaining: 0,
      daysOverdue: diffDaysCeil(endDate, now),
      isAcceptable: false,
    };
  }

  return {
    status: 'open',
    startDate,
    endDate,
    daysRemaining: diffDaysCeil(now, endDate),
    daysOverdue: 0,
    isAcceptable: true,
  };
}

export function formatConferenceDay(date: Date, locale = 'pt-PT'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
