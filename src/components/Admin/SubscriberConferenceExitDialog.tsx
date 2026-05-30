'use client';

import { useRouter } from 'next/navigation';
import { clearAdminSecret } from '@/lib/admin-auth';
import './SubscriberConferenceExitDialog.css';

type SubscriberConferenceExitDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function SubscriberConferenceExitDialog({
  open,
  onClose,
}: SubscriberConferenceExitDialogProps) {
  const router = useRouter();

  if (!open) return null;

  function handleKeepSession() {
    onClose();
    router.push('/conferencia');
  }

  function handleLeaveAccount() {
    clearAdminSecret();
    onClose();
    router.push('/conferencia');
  }

  return (
    <div className="subscriber-exit-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="subscriber-exit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscriber-exit-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="subscriber-exit-dialog-title" className="subscriber-exit-dialog-title">
          Abrir a página da conferência?
        </h2>
        <p className="subscriber-exit-dialog-text">
          Pode visitar a página da conferência mantendo a sessão iniciada ou sair da conta antes de
          continuar.
        </p>
        <div className="subscriber-exit-dialog-actions">
          <button type="button" className="subscriber-exit-dialog-btn primary" onClick={handleKeepSession}>
            Manter sessão
          </button>
          <button type="button" className="subscriber-exit-dialog-btn danger" onClick={handleLeaveAccount}>
            Sair da conta
          </button>
          <button type="button" className="subscriber-exit-dialog-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
