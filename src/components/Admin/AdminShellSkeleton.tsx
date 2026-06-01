import { AdminPanelLoading } from '@/components/Admin/AdminPanelLoading';
import './admin-shell-skeleton.css';
import './admin-wp.css';

type AdminShellSkeletonProps = {
  variant?: 'default' | 'dashboard';
};

/** Layout do painel admin (barra + menu + conteúdo) durante carregamento da sessão. */
export default function AdminShellSkeleton({ variant = 'default' }: AdminShellSkeletonProps) {
  return (
    <div className="admin-shell-skeleton" role="status" aria-busy="true" aria-label="A carregar painel">
      <header className="admin-shell-skeleton-bar" aria-hidden="true">
        <div className="admin-shell-skeleton-bar-title wp-skeleton-pulse" />
        <div className="admin-shell-skeleton-bar-actions">
          <div className="admin-shell-skeleton-bar-pill wp-skeleton-pulse" />
          <div className="admin-shell-skeleton-bar-pill wp-skeleton-pulse" />
        </div>
      </header>

      <div className="admin-shell-skeleton-body">
        <aside className="admin-shell-skeleton-sidebar" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`admin-shell-skeleton-nav-item wp-skeleton-pulse ${
                i === 0 ? 'admin-shell-skeleton-nav-item--active' : ''
              }`}
            />
          ))}
          <div className="admin-shell-skeleton-account">
            <div className="admin-shell-skeleton-avatar wp-skeleton-pulse" />
            <div className="admin-shell-skeleton-account-lines">
              <div className="admin-shell-skeleton-line wp-skeleton-pulse" />
              <div className="admin-shell-skeleton-line admin-shell-skeleton-line--short wp-skeleton-pulse" />
            </div>
          </div>
        </aside>

        <main className="admin-shell-skeleton-main">
          <AdminPanelLoading variant={variant} />
        </main>
      </div>
    </div>
  );
}
