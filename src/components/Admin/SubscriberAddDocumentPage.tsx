'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { CONFERENCIA_COPY } from '@/data/conferencia-content';
import { useSessionUser } from '@/hooks/useSessionUser';
import ConferenceSubmissionForm from '@/components/Site/ConferenceSubmissionForm';
import '@/app/(admin)/dashboard/documentos-gerais/documentos-conferencia.css';

export default function SubscriberAddDocumentPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = CONFERENCIA_COPY[locale];
  const { user } = useSessionUser();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.username
    || '';

  const handleSubmitted = useCallback(() => {
    router.push('/dashboard/meus-documentos');
  }, [router]);

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header">
        <div>
          <h1 className="docs-admin-title">Enviar documentos</h1>
          <p className="docs-admin-intro">{t.dashboardSubmissionIntro}</p>
        </div>
      </div>

      <div className="docs-admin-container">
        <ConferenceSubmissionForm
          labels={t.form}
          defaultName={displayName}
          defaultEmail={user?.email || ''}
          authenticated
          onSubmitted={handleSubmitted}
        />
      </div>
    </div>
  );
}
