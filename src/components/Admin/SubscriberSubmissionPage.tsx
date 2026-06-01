'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import { interpolateSubmissionDeadline } from '@/lib/conference-schedule';
import { useSessionUser } from '@/hooks/useSessionUser';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import SubmissionSidebar from '@/components/Admin/SubmissionSidebar';
import '@/app/(admin)/admin/documentos-gerais/documentos-conferencia.css';

type SubscriberSubmissionPageProps = {
  title?: string;
};

export default function SubscriberSubmissionPage({
  title = 'Submissão de resumo',
}: SubscriberSubmissionPageProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const { user } = useSessionUser();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || '';

  const handleSubmitted = useCallback(() => {
    router.push('/dashboard/meus-documentos');
  }, [router]);

  return (
    <div className="docs-admin-page submission-page">
      <div className="docs-admin-header submission-page-header">
        <div>
          <h1 className="docs-admin-title">{title}</h1>
          <p className="docs-admin-intro">
            {interpolateSubmissionDeadline(t.dashboardSubmissionIntro, locale)}
          </p>
        </div>
      </div>

      <div className="submission-page-layout">
        <div className="submission-page-form">
          <ConferenceSubmissionForm
            labels={t.form}
            defaultName={displayName}
            defaultEmail={user?.email || ''}
            authenticated
            onSubmitted={handleSubmitted}
          />
        </div>
        <SubmissionSidebar locale={locale} />
      </div>
    </div>
  );
}
