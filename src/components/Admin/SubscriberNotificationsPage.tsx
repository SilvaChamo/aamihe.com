'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useSubscriberNotifications } from '@/hooks/useSubscriberNotifications';
import '@/app/(admin)/admin/documentos-gerais/documentos-conferencia.css';

function formatWhen(value: string) {
  return new Date(value).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SubscriberNotificationsPage() {
  const { notifications, ready, refreshing, markRead, markAllRead, marking } =
    useSubscriberNotifications();
  const hasUnread = notifications.some((item) => !item.read);

  return (
    <div className="docs-admin-page">
      <div className="docs-admin-header subscriber-notifications-header">
          <div>
            <h1 className="docs-admin-title">Notificações</h1>
            <p className="docs-admin-intro">
              Comunicações da comissão científica sobre os seus documentos enviados.
              {refreshing ? ' · A actualizar…' : null}
            </p>
          </div>
          {hasUnread ? (
            <button
              type="button"
              className="aamihe-btn aamihe-btn--sm aamihe-btn--secondary"
              disabled={marking}
              onClick={markAllRead}
            >
              {marking ? 'A actualizar…' : 'Marcar todas como lidas'}
            </button>
          ) : null}
      </div>

      <div className="docs-admin-container">
        {!ready ? null : notifications.length === 0 ? (
          <div className="docs-admin-empty-state">
            <Bell size={40} />
            <h2>Sem notificações</h2>
            <p>Quando a comissão analisar os seus documentos, as respostas aparecerão aqui.</p>
          </div>
        ) : (
          <ul className="subscriber-notifications-list">
            {notifications.map((item) => (
              <li
                key={item.id}
                className={`subscriber-notification ${item.read ? 'read' : 'unread'} ${item.type}`}
              >
                <div className="subscriber-notification-row">
                  <div className="subscriber-notification-content">
                    <div className="subscriber-notification-title-line">
                      <strong>{item.title}</strong>
                      <time dateTime={item.created_at}>{formatWhen(item.created_at)}</time>
                    </div>
                    <p className="subscriber-notification-message">{item.message}</p>
                  </div>
                  <div className="subscriber-notification-actions">
                    <Link
                      href={`/dashboard/meus-documentos/editar/${item.document_id}`}
                      className="aamihe-btn aamihe-btn--sm aamihe-btn--secondary"
                      onClick={() => {
                        if (!item.read) void markRead(item.id);
                      }}
                    >
                      Ver documento
                    </Link>
                    {!item.read ? (
                      <button
                        type="button"
                        className="aamihe-btn aamihe-btn--sm aamihe-btn--ghost"
                        onClick={() => void markRead(item.id)}
                      >
                        Marcar lida
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
