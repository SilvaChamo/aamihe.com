'use client';

import './admin-wp.css';
import './panel-skeleton.css';

export function PanelPageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="docs-admin-header panel-skeleton-header wp-skeleton-pulse">
      <div className="panel-skeleton-block">
        <div className="panel-skeleton-title" />
        <div className="panel-skeleton-intro" />
      </div>
      {withAction ? <div className="panel-skeleton-btn" /> : null}
    </div>
  );
}

export function PanelNotificationsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="subscriber-notifications-list">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="subscriber-notification panel-skeleton-notification wp-skeleton-pulse">
          <div className="subscriber-notification-row">
            <div className="panel-skeleton-block">
              <div className="panel-skeleton-line panel-skeleton-line--title" />
              <div className="panel-skeleton-line panel-skeleton-line--message" />
              <div className="panel-skeleton-line panel-skeleton-line--message short" />
            </div>
            <div className="subscriber-notification-actions">
              <div className="panel-skeleton-mini-btn" />
              <div className="panel-skeleton-mini-btn" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PanelDocumentsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="docs-subscriber-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel-skeleton-doc-card wp-skeleton-pulse">
          <div className="panel-skeleton-doc-thumb" />
          <div className="panel-skeleton-doc-body">
            <div className="panel-skeleton-doc-title" />
            <div className="panel-skeleton-doc-meta">
              <div className="panel-skeleton-doc-date" />
              <div className="panel-skeleton-doc-badge" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PanelAdminCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="docs-admin-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel-skeleton-admin-card wp-skeleton-pulse">
          <div className="panel-skeleton-admin-icon" />
          <div className="panel-skeleton-admin-title" />
          <div className="panel-skeleton-admin-meta" />
        </div>
      ))}
    </div>
  );
}

export function PanelStatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="dashboard-stats-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel-skeleton-stat wp-skeleton-pulse">
          <div className="panel-skeleton-stat-icon" />
          <div className="panel-skeleton-stat-value" />
          <div className="panel-skeleton-stat-label" />
        </div>
      ))}
    </div>
  );
}

export function PanelActivitySkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="dashboard-activity-list">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="panel-skeleton-activity wp-skeleton-pulse">
          <div className="panel-skeleton-activity-date" />
          <div className="panel-skeleton-activity-title" />
        </li>
      ))}
    </ul>
  );
}
