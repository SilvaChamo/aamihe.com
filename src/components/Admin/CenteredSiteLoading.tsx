import './admin-wp.css';

export default function CenteredSiteLoading({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div className="wp-loading-center wp-loading-center--full" role="status" aria-live="polite">
      <span className="wp-site-loading-spinner" aria-hidden="true" />
      <p className="wp-site-loading-label">{label}</p>
    </div>
  );
}

