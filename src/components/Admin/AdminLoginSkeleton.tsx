import './AdminLoginPage.css';
import './admin-login-skeleton.css';

/** Mesma árvore DOM e classes que AdminLoginPage (2 colunas + formulário à direita). */
export default function AdminLoginSkeleton() {
  return (
    <div
      className="admin-login-page admin-login-page--skeleton"
      role="status"
      aria-busy="true"
      aria-label="A carregar página de login"
    >
      <div className="admin-login-left" role="img" aria-hidden="true" />

      <div className="admin-login-panel">
        <div className="admin-login-panel-inner">
          <div className="admin-login-card">
            <div className="admin-login-form-box">
              <div className="admin-login-form-logo">
                <div className="admin-login-skeleton-shimmer admin-login-skeleton-logo" />
              </div>

              <div className="admin-login-form admin-login-form--skeleton" aria-hidden="true">
                <div className="admin-login-skeleton-shimmer admin-login-skeleton-input" />
                <div className="wp-pwd">
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-input" />
                  <span className="admin-login-skeleton-eye" />
                </div>
                <div className="forgetmenot">
                  <span className="admin-login-skeleton-shimmer admin-login-skeleton-checkbox" />
                  <span className="admin-login-skeleton-shimmer admin-login-skeleton-check-label" />
                </div>
                <div className="admin-login-submit-row">
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-submit-btn" />
                  <div className="admin-login-skeleton-shimmer admin-login-skeleton-google-btn" />
                </div>
                <div className="admin-login-form-links">
                  <span className="admin-login-skeleton-shimmer admin-login-skeleton-link" />
                  <span className="admin-login-skeleton-shimmer admin-login-skeleton-link" />
                </div>
              </div>
            </div>

            <p className="admin-login-back">
              <span className="admin-login-skeleton-shimmer admin-login-skeleton-back-line" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
