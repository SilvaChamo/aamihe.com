import './AdminLoginPage.css';
import './admin-login-skeleton.css';

/** Espelha o layout de AdminLoginPage enquanto a sessão ou o formulário carregam. */
export default function AdminLoginSkeleton() {
  return (
    <div
      className="admin-login-page"
      role="status"
      aria-busy="true"
      aria-label="A carregar página de login"
    >
      <div className="admin-login-left admin-login-left--skeleton" aria-hidden="true" />

      <div className="admin-login-panel">
        <div className="admin-login-panel-inner">
          <div className="admin-login-form-logo">
            <div className="admin-login-skeleton-shimmer admin-login-skeleton-logo" />
          </div>

          <div className="admin-login-card">
            <div className="admin-login-form-box">
              <div className="admin-login-form" style={{ gap: 16 }}>
                <div className="admin-login-skeleton-shimmer admin-login-skeleton-field" />
                <div className="admin-login-skeleton-shimmer admin-login-skeleton-field" />
                <div className="admin-login-skeleton-shimmer admin-login-skeleton-field--short" />
                <div className="admin-login-skeleton-submit-row">
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-btn" />
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-google" />
                </div>
                <div className="admin-login-skeleton-links">
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-link" />
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-link" />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-login-skeleton-shimmer admin-login-skeleton-back" />
        </div>
      </div>
    </div>
  );
}
