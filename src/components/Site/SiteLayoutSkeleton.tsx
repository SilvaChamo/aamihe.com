import './site-skeleton.css';

type SiteLayoutSkeletonProps = {
  /** Inclui bloco hero (home). Páginas internas podem omitir. */
  withHero?: boolean;
};

/** Espelha header + secções típicas do site público AAMIHE. */
export default function SiteLayoutSkeleton({ withHero = true }: SiteLayoutSkeletonProps) {
  return (
    <div className="site-skeleton" role="status" aria-busy="true" aria-label="A carregar">
      <header className="site-skeleton-header" aria-hidden="true">
        <div className="site-skeleton-shimmer site-skeleton-logo" />
        <nav className="site-skeleton-nav">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="site-skeleton-shimmer site-skeleton-nav-item" />
          ))}
        </nav>
        <div className="site-skeleton-header-actions">
          <div className="site-skeleton-shimmer site-skeleton-search" />
          <div className="site-skeleton-shimmer site-skeleton-cta" />
        </div>
      </header>

      {withHero ? (
        <div className="site-skeleton-hero" aria-hidden="true">
          <div className="site-skeleton-hero-text">
            <div className="site-skeleton-shimmer site-skeleton-hero-title" />
            <div className="site-skeleton-shimmer site-skeleton-hero-sub" />
          </div>
        </div>
      ) : null}

      <section className="site-skeleton-section" aria-hidden="true">
        <div className="site-skeleton-shimmer site-skeleton-section-title" />
        <div className="site-skeleton-cards">
          {Array.from({ length: 3 }, (_, i) => (
            <article key={i} className="site-skeleton-card">
              <div className="site-skeleton-shimmer site-skeleton-card-image" />
              <div className="site-skeleton-card-body">
                <div className="site-skeleton-shimmer site-skeleton-card-line" />
                <div className="site-skeleton-shimmer site-skeleton-card-line site-skeleton-card-line--short" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="site-skeleton-footer" aria-hidden="true" />
    </div>
  );
}
