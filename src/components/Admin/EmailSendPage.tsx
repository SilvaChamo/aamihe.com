'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp, Gauge, Loader2, Send, Users } from 'lucide-react';
import { useAdminBase } from '@/lib/admin-base';
import { adminFetch } from '@/lib/admin-auth';
import { htmlToPlainText } from '@/lib/email-template';
import EmailComposer from './EmailComposer';
import './NewsForm.css';
import './admin-wp.css';
import './EmailSendPage.css';

type EmailQuota = {
  dailyLimit: number;
  sentToday: number;
  remainingToday: number;
  dateKey: string;
};

type SenderAccount = {
  id: string;
  email: string;
  name: string;
  label: string;
  from: string;
};

export function EmailSendPageSkeleton({ isMarketing }: { isMarketing: boolean }) {
  return (
    <div
      className="news-form-container email-send-page email-send-page--skeleton"
      aria-busy="true"
      aria-label="A carregar"
    >
      <div className="news-form-layout email-send-layout">
        <div className="news-form-main email-send-form-main">
          <div className="email-send-page-head">
            <div className="email-send-header-row">
              <div
                className="wp-skeleton-pulse"
                style={{ height: 26, width: 240, background: '#dcdcde', borderRadius: 6 }}
                aria-hidden
              />
            </div>

            {isMarketing ? (
              <div className="email-send-subtitle-row email-send-intro">
                <div
                  className="wp-skeleton-pulse"
                  style={{
                    height: 14,
                    width: '72%',
                    background: '#dcdcde',
                    borderRadius: 3,
                  }}
                  aria-hidden
                />
                <div
                  className="wp-skeleton-pulse"
                  style={{ height: 18, width: 190, background: '#dcdcde', borderRadius: 4 }}
                  aria-hidden
                />
              </div>
            ) : (
              <p className="news-form-locale-hint email-send-intro">
                <span
                  className="wp-skeleton-pulse"
                  style={{
                    height: 14,
                    width: '75%',
                    background: '#dcdcde',
                    borderRadius: 3,
                    display: 'inline-block',
                  }}
                  aria-hidden
                />
              </p>
            )}
          </div>

          {isMarketing ? (
            <div className="email-marketing-form-block">
              <div className="email-normal-top-row">
                <div
                  className="wp-skeleton-pulse"
                  style={{ height: 40, width: 120, background: '#dcdcde', borderRadius: 6 }}
                  aria-hidden
                />
                <div className="email-normal-fields-col">
                  <div
                    className="wp-skeleton-pulse email-sender-select"
                    style={{ height: 36, background: '#dcdcde', borderRadius: 6, margin: 0 }}
                    aria-hidden
                  />
                  <div
                    className="wp-skeleton-pulse news-form-title-input email-normal-subject"
                    style={{ height: 36, background: '#dcdcde', borderRadius: 6, margin: 0 }}
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="email-normal-top-row">
              <div
                className="wp-skeleton-pulse"
                style={{ height: 40, width: 120, background: '#dcdcde', borderRadius: 6 }}
                aria-hidden
              />
              <div className="email-normal-fields-col">
                <div
                  className="wp-skeleton-pulse email-sender-select"
                  style={{ height: 36, background: '#dcdcde', borderRadius: 6, margin: 0 }}
                  aria-hidden
                />
                <div
                  className="wp-skeleton-pulse news-form-title-input email-normal-subject"
                  style={{ height: 36, background: '#dcdcde', borderRadius: 6, margin: 0 }}
                  aria-hidden
                />
              </div>
            </div>
          )}

          <div className="email-composer" aria-hidden="true">
            <div className="email-composer-tabs">
              <div className="wp-skeleton-pulse" style={{ height: 40, width: 82, background: '#dcdcde' }} />
              <div className="wp-skeleton-pulse" style={{ height: 40, width: 68, background: '#dcdcde' }} />
              <div className="wp-skeleton-pulse" style={{ height: 40, width: 140, background: '#dcdcde' }} />
            </div>
            <div className="email-composer-toolbar">
              <div className="wp-skeleton-pulse" style={{ height: 32, width: 170, background: '#dcdcde', borderRadius: 4 }} />
              <div className="wp-skeleton-pulse" style={{ height: 28, width: 32, background: '#dcdcde', borderRadius: 4 }} />
              <div className="wp-skeleton-pulse" style={{ height: 28, width: 32, background: '#dcdcde', borderRadius: 4, marginLeft: 4 }} />
              <div className="wp-skeleton-pulse" style={{ height: 28, width: 32, background: '#dcdcde', borderRadius: 4, marginLeft: 4 }} />
            </div>
            <div className="email-composer-body">
              <div
                className="email-composer-editor wp-skeleton-pulse"
                style={{ minHeight: 420, background: '#f3f4f6', borderRadius: 0 }}
              />
            </div>
          </div>
        </div>

        <div className="news-form-sidebar email-send-sidebar">
          <div className="email-send-mode-panel-body">
            <div className="email-send-mode-tabs" aria-hidden="true">
              <div className="wp-skeleton-pulse" style={{ height: 44, width: 140, background: '#dcdcde', borderRadius: 6 }} />
              <div className="wp-skeleton-pulse" style={{ height: 44, width: 150, background: '#dcdcde', borderRadius: 6 }} />
            </div>
          </div>

          {!isMarketing ? (
            <div className="news-form-panel" aria-hidden="true" style={{ marginTop: 14 }}>
              <div className="news-form-panel-header">
                <div className="wp-skeleton-pulse" style={{ height: 14, width: 110, background: '#dcdcde', borderRadius: 3 }} />
              </div>
              <div className="news-form-panel-body">
                <div className="wp-skeleton-pulse" style={{ height: 12, width: '85%', background: '#e8e8e8', borderRadius: 3, marginBottom: 10 }} />
                <div className="wp-skeleton-pulse" style={{ height: 12, width: '70%', background: '#e8e8e8', borderRadius: 3 }} />
              </div>
            </div>
          ) : null}

          <div className="news-form-panel" aria-hidden="true" style={{ marginTop: 14 }}>
            <div className="news-form-panel-header">
              <div className="wp-skeleton-pulse" style={{ height: 14, width: 105, background: '#dcdcde', borderRadius: 3 }} />
            </div>
            <div className="news-form-panel-body">
              <div className="wp-skeleton-pulse" style={{ height: 12, width: '90%', background: '#e8e8e8', borderRadius: 3, marginBottom: 10 }} />
              <div className="wp-skeleton-pulse" style={{ height: 12, width: '78%', background: '#e8e8e8', borderRadius: 3, marginBottom: 10 }} />
              <div className="wp-skeleton-pulse" style={{ height: 12, width: '92%', background: '#e8e8e8', borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailSendPage() {
  const base = useAdminBase();
  const pathname = usePathname();
  const isMarketing = !pathname.includes('/enviar-email/normal');

  const [count, setCount] = useState<number | null>(null);
  const [quota, setQuota] = useState<EmailQuota | null>(null);
  const [senders, setSenders] = useState<SenderAccount[]>([]);
  const [senderId, setSenderId] = useState('');
  const [statsLoading, setStatsLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [preheader, setPreheader] = useState('');
  const [preheaderOpen, setPreheaderOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [emailHint, setEmailHint] = useState('');

  const marketingHref = `${base}/enviar-email`;
  const normalHref = `${base}/enviar-email/normal`;

  const overQuota = quota != null && count != null && count > quota.remainingToday;
  const noQuotaLeft = quota != null && quota.remainingToday <= 0;
  const statsPending = statsLoading && count === null;
  const sendDisabled = isMarketing
    ? sending ||
      statsPending ||
      count === 0 ||
      overQuota ||
      noQuotaLeft ||
      !emailConfigured
    : sending || noQuotaLeft || !emailConfigured;
  const fieldsDisabled = sending || !emailConfigured;

  const loadStats = useCallback(async () => {
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await adminFetch('/api/admin/subscribers/broadcast', {
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar destinatários');
      }
      setCount(typeof data.count === 'number' ? data.count : 0);
      setQuota(data.quota || null);
      const list: SenderAccount[] = Array.isArray(data.senders) ? data.senders : [];
      setSenders(list);
      setSenderId((prev) => prev || list[0]?.id || '');
      setEmailConfigured(data.emailConfigured !== false);
      setEmailHint(typeof data.emailHint === 'string' ? data.emailHint : '');
    } catch (err) {
      setCount(0);
      setQuota(null);
      setSenders([]);
      setEmailConfigured(false);
      setEmailHint('');
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'O carregamento demorou demasiado. Pode redigir o e-mail; tente atualizar a página para ver destinatários.'
          : err instanceof Error
            ? err.message
            : 'Erro ao carregar destinatários';
      setError(message);
    } finally {
      window.clearTimeout(timeout);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedSubject = subject.trim();
    const trimmedHtml = html.trim();
    const plainText = htmlToPlainText(trimmedHtml);

    if (!trimmedSubject || !plainText) {
      setError('Preencha o assunto e o conteúdo do e-mail.');
      return;
    }

    if (isMarketing) {
      if (overQuota || noQuotaLeft) {
        setError(
          `Limite diário: restam ${quota?.remainingToday ?? 0} envios hoje (${quota?.sentToday ?? 0}/${quota?.dailyLimit ?? 50}).`,
        );
        return;
      }
      if (!confirm(`Enviar este e-mail para ${count ?? 0} subscritor(es)?`)) return;
    } else {
      if (!toEmail.trim()) {
        setError('Indique o e-mail do destinatário.');
        return;
      }
    }

    setSending(true);
    try {
      const res = await adminFetch('/api/admin/subscribers/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: trimmedSubject,
          html: trimmedHtml,
          preheader: isMarketing ? preheader.trim() : '',
          message: plainText,
          senderId,
          mode: isMarketing ? 'marketing' : 'normal',
          ...(isMarketing
            ? {}
            : {
                to: toEmail.trim(),
                cc: showCc ? ccEmail.trim() : '',
                bcc: showBcc ? bccEmail.trim() : '',
              }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar e-mails');

      setSuccess(
        isMarketing
          ? `E-mail enviado para ${data.sent} destinatário(s).`
          : 'E-mail enviado com sucesso.',
      );
      setSubject('');
      setToEmail('');
      setCcEmail('');
      setBccEmail('');
      setShowCc(false);
      setShowBcc(false);
      setPreheader('');
      setPreheaderOpen(false);
      setHtml('');
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mails');
    } finally {
      setSending(false);
    }
  };

  const senderSelectField = (
    <select
      id="email-sender"
      className="email-sender-select"
      value={senderId}
      onChange={(e) => setSenderId(e.target.value)}
      disabled={fieldsDisabled}
      aria-label="Remetente"
    >
      {statsLoading && senders.length === 0 ? (
        <option value="">A carregar contas…</option>
      ) : senders.length === 0 ? (
        <option value="">Sem contas disponíveis</option>
      ) : (
        senders.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))
      )}
    </select>
  );

  const normalSendButton = (
    <button
      type="submit"
      className={`news-form-submit email-normal-send-btn${sending ? ' email-normal-send-btn--sending' : ''}`}
      disabled={sendDisabled}
      aria-busy={sending}
    >
      {sending ? (
        <>
          <Loader2 size={18} className="wp-spin email-normal-send-spinner" aria-hidden />
          <span>A enviar…</span>
        </>
      ) : (
        'ENVIAR'
      )}
    </button>
  );

  const marketingSendButton = (
    <button type="submit" className="news-form-submit email-normal-send-btn" disabled={sendDisabled}>
      {sending ? (
        <>
          <Loader2 size={14} className="wp-spin" style={{ marginRight: 6 }} />
          A enviar…
        </>
      ) : (
        'ENVIAR'
      )}
    </button>
  );

  return (
    <div className="news-form-container email-send-page" key={pathname}>
      <form onSubmit={handleSubmit} className="news-form-layout email-send-layout">
        <div className="news-form-main email-send-form-main">
          {!statsPending && !emailConfigured && emailHint ? (
            <p className="wp-notice-error">{emailHint}</p>
          ) : null}
          {error ? <p className="wp-notice-error">{error}</p> : null}
          {success ? <p className="wp-notice-success">{success}</p> : null}
          {overQuota && !noQuotaLeft ? (
            <p className="wp-notice-error">
              Esta campanha tem {count} destinatários, mas só restam {quota?.remainingToday} envios
              hoje. Aguarde até amanhã ou contacte o administrador para aumentar o limite.
            </p>
          ) : null}

          <div className="email-send-page-head">
            <div className="email-send-header-row">
              <h1 className="email-send-page-title">Enviar e-mail</h1>
            </div>

            {isMarketing ? (
              <div className="email-send-subtitle-row email-send-intro">
                <p className="news-form-locale-hint">
                  Notificação avançada com logotipo AAMIHE — campanha para todos os subscritores.
                </p>
                <button
                  type="button"
                  className="email-preheader-toggle"
                  onClick={() => setPreheaderOpen((open) => !open)}
                  disabled={fieldsDisabled}
                  aria-expanded={preheaderOpen}
                >
                  Pré-cabeçalho (opcional)
                </button>
              </div>
            ) : (
              <p className="news-form-locale-hint email-send-intro">
                E-mail individual para um destinatário (Para, Cc ou Bcc).
              </p>
            )}
          </div>

          {isMarketing ? (
            <>
              <div className="email-marketing-form-block">
                <div className="email-normal-top-row">
                  {marketingSendButton}
                  <div className="email-normal-fields-col">
                    {senderSelectField}
                    <input
                      id="email-subject"
                      type="text"
                      placeholder="Assunto do e-mail"
                      className="news-form-title-input email-normal-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={fieldsDisabled}
                      required
                    />
                  </div>
                </div>

                <div className={`email-preheader-slide${preheaderOpen ? ' is-open' : ''}`}>
                  <div className="email-preheader-slide-inner">
                    <div className="news-form-panel email-preheader-panel">
                      <div className="news-form-panel-header">
                        <h2>Pré-cabeçalho (opcional)</h2>
                        <ChevronUp size={16} />
                      </div>
                      <div className="news-form-panel-body email-preheader-panel-body">
                        <input
                          type="text"
                          className="news-form-textarea email-preheader-input"
                          style={{ minHeight: 'auto', height: 40, resize: 'none' }}
                          placeholder="Texto curto visível na caixa de entrada, antes de abrir o e-mail…"
                          value={preheader}
                          onChange={(e) => setPreheader(e.target.value)}
                          disabled={fieldsDisabled}
                          maxLength={120}
                        />
                        <p className="news-form-locale-hint" style={{ marginTop: 8 }}>
                          Máximo 120 caracteres. Aparece como pré-visualização na caixa de entrada.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="email-normal-top-row">
              {normalSendButton}
              <div className="email-outlook-fields">
                <div className="email-outlook-row">
                  <span className="email-outlook-label">De</span>
                  <div className="email-outlook-control">{senderSelectField}</div>
                </div>
                <div className="email-outlook-row email-outlook-row--to">
                  <span className="email-outlook-label">Para</span>
                  <div className="email-outlook-control">
                    <input
                      id="email-to"
                      type="email"
                      placeholder="destinatario@exemplo.com"
                      className="email-outlook-input"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      disabled={fieldsDisabled}
                      required
                    />
                  </div>
                  <div className="email-outlook-extra-links">
                    <button
                      type="button"
                      className={`email-outlook-link${showCc ? ' is-active' : ''}`}
                      onClick={() => setShowCc((open) => !open)}
                      disabled={fieldsDisabled}
                      aria-expanded={showCc}
                    >
                      Cc
                    </button>
                    <button
                      type="button"
                      className={`email-outlook-link${showBcc ? ' is-active' : ''}`}
                      onClick={() => setShowBcc((open) => !open)}
                      disabled={fieldsDisabled}
                      aria-expanded={showBcc}
                    >
                      Bcc
                    </button>
                  </div>
                </div>
                {showCc ? (
                  <div className="email-outlook-row">
                    <span className="email-outlook-label">Cc</span>
                    <div className="email-outlook-control">
                      <input
                        id="email-cc"
                        type="text"
                        placeholder="cc@exemplo.com"
                        className="email-outlook-input"
                        value={ccEmail}
                        onChange={(e) => setCcEmail(e.target.value)}
                        disabled={fieldsDisabled}
                      />
                    </div>
                  </div>
                ) : null}
                {showBcc ? (
                  <div className="email-outlook-row">
                    <span className="email-outlook-label">Bcc</span>
                    <div className="email-outlook-control">
                      <input
                        id="email-bcc"
                        type="text"
                        placeholder="bcc@exemplo.com"
                        className="email-outlook-input"
                        value={bccEmail}
                        onChange={(e) => setBccEmail(e.target.value)}
                        disabled={fieldsDisabled}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="email-outlook-row">
                  <span className="email-outlook-label">Assunto</span>
                  <div className="email-outlook-control">
                    <input
                      id="email-subject"
                      type="text"
                      placeholder="Assunto do e-mail"
                      className="email-outlook-input"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={fieldsDisabled}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <EmailComposer
            value={html}
            onChange={setHtml}
            preheader={isMarketing ? preheader : ''}
            subject={subject}
            disabled={fieldsDisabled}
            placeholder="Escreva o corpo do e-mail aqui…"
            previewVariant={isMarketing ? 'marketing' : 'plain'}
          />

        </div>

        <div className="news-form-sidebar email-send-sidebar">
          <div className="email-send-mode-panel-body">
            <div className="email-send-mode-tabs">
              <Link
                href={normalHref}
                className={`email-send-mode-tab${!isMarketing ? ' is-active' : ''}`}
                aria-current={!isMarketing ? 'page' : undefined}
              >
                E-mail normal
              </Link>
              <Link
                href={marketingHref}
                className={`email-send-mode-tab${isMarketing ? ' is-active' : ''}`}
                aria-current={isMarketing ? 'page' : undefined}
              >
                Mail marketing
              </Link>
            </div>
          </div>

          {isMarketing ? (
            <div className="news-form-panel">
              <div className="news-form-panel-header">
                <h2>Destinatários</h2>
                <ChevronUp size={16} />
              </div>
              <div className="news-form-panel-body">
                <div className="news-form-meta">
                  <div className="news-form-meta-row">
                    <Users size={16} />
                    <span>
                      Total:{' '}
                      <strong>
                        {statsPending ? '…' : count}{' '}
                        {!statsPending && (count === 1 ? 'subscritor' : 'subscritores')}
                      </strong>
                    </span>
                  </div>
                  <p className="news-form-locale-hint" style={{ margin: '8px 0 0' }}>
                    Contas Subscritor e e-mails das submissões da conferência (sem duplicados).
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="news-form-panel">
            <div className="news-form-panel-header">
              <h2>Limite diário</h2>
              <ChevronUp size={16} />
            </div>
            <div className="news-form-panel-body">
              <div className="news-form-meta">
                <div className="news-form-meta-row">
                  <Gauge size={16} />
                  <span>
                    Hoje:{' '}
                    <strong>
                      {statsPending
                        ? '…'
                        : `${quota?.sentToday ?? 0} / ${quota?.dailyLimit ?? 50} enviados`}
                    </strong>
                  </span>
                </div>
                <div className="news-form-meta-row">
                  <Send size={16} />
                  <span>
                    Restantes: <strong>{statsPending ? '…' : quota?.remainingToday ?? 0}</strong>
                  </span>
                </div>
                <p className="news-form-locale-hint" style={{ margin: '8px 0 0' }}>
                  Recomendado: máximo {quota?.dailyLimit ?? 50} e-mails por dia para proteger a
                  reputação do remetente perante Gmail e outros provedores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
