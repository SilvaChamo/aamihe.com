'use client';

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Receipt,
} from 'lucide-react';
import { CONFERENCIA_COPY, CONFERENCIA_YEAR, CONFERENCE_SCHEDULE } from '@/data/conferencia-content';
import {
  formatScheduleDate,
  getConferenceFees,
  getLateSubmissionFee,
} from '@/lib/conference-schedule';
import {
  formatConferenceDay,
  getSubmissionPeriodReport,
} from '@/lib/conference-submission-window';

type SubmissionSidebarProps = {
  locale?: 'pt' | 'fr' | 'en';
};

export default function SubmissionSidebar({ locale = 'pt' }: SubmissionSidebarProps) {
  const copy = CONFERENCIA_COPY[locale];
  const fees = getConferenceFees(locale);
  const period = getSubmissionPeriodReport();

  const periodClass =
    period.status === 'open'
      ? 'submission-sidebar-period--open'
      : period.status === 'not_started'
        ? 'submission-sidebar-period--pending'
        : 'submission-sidebar-period--closed';

  const periodTitle =
    period.status === 'open'
      ? 'Período de envio aberto'
      : period.status === 'not_started'
        ? 'Envio ainda não iniciado'
        : 'Prazo de envio encerrado';

  const periodMessage =
    period.status === 'open'
      ? `Está dentro do prazo aceitável. Faltam ${period.daysRemaining} dia${period.daysRemaining === 1 ? '' : 's'} para o fim do envio.`
      : period.status === 'not_started'
        ? `O envio abre a ${formatConferenceDay(period.startDate)}. Faltam ${period.daysRemaining} dia${period.daysRemaining === 1 ? '' : 's'}.`
        : `O prazo terminou há ${period.daysOverdue} dia${period.daysOverdue === 1 ? '' : 's'}. Submissões tardias estão sujeitas a taxas adicionais.`;

  const submissionStartLabel = formatScheduleDate(CONFERENCE_SCHEDULE.submission.startIso, locale);
  const submissionEndLabel = formatScheduleDate(CONFERENCE_SCHEDULE.submission.endIso, locale);

  return (
    <aside className="submission-sidebar" aria-label="Informação da conferência e submissões">
      <section className="submission-sidebar-card">
        <h2 className="submission-sidebar-heading">
          <CalendarDays size={16} aria-hidden />
          Conferência {CONFERENCIA_YEAR}
        </h2>
        <dl className="submission-sidebar-meta">
          <div>
            <dt>Realização</dt>
            <dd>{copy.date}</dd>
          </div>
          <div>
            <dt>
              <MapPin size={13} aria-hidden />
              Local
            </dt>
            <dd>{copy.venue}</dd>
          </div>
          <div>
            <dt>Tema</dt>
            <dd className="submission-sidebar-theme">{copy.themeTitle}</dd>
          </div>
        </dl>
      </section>

      <section className={`submission-sidebar-card submission-sidebar-period ${periodClass}`}>
        <h2 className="submission-sidebar-heading">
          {period.isAcceptable ? (
            <CheckCircle2 size={16} aria-hidden />
          ) : period.status === 'closed' ? (
            <AlertTriangle size={16} aria-hidden />
          ) : (
            <Clock3 size={16} aria-hidden />
          )}
          Prazo de submissão
        </h2>
        <p className="submission-sidebar-period-title">{periodTitle}</p>
        <p className="submission-sidebar-period-message">{periodMessage}</p>
        <dl className="submission-sidebar-dates">
          <div>
            <dt>Início do envio</dt>
            <dd>{submissionStartLabel}</dd>
          </div>
          <div>
            <dt>Data final de envio</dt>
            <dd>{submissionEndLabel}</dd>
          </div>
        </dl>
      </section>

      {period.status === 'closed' ? (
        <section className="submission-sidebar-card submission-sidebar-fees">
          <h2 className="submission-sidebar-heading">
            <Receipt size={16} aria-hidden />
            Taxas aplicáveis
          </h2>
          <ul className="submission-sidebar-fee-list">
            <li>
              <strong>Submissão tardia de resumo</strong>
              <span>{getLateSubmissionFee(locale)}</span>
            </li>
            <li>
              <strong>{fees.lateLabel}</strong>
              <span>{fees.lateValue}</span>
            </li>
            <li>
              <strong>{fees.standardLabel}</strong>
              <span>{fees.standardValue}</span>
            </li>
          </ul>
          <p className="submission-sidebar-fee-note">
            Contacte {fees.contactEmail} para regularizar pagamentos após o prazo.
          </p>
        </section>
      ) : null}
    </aside>
  );
}
