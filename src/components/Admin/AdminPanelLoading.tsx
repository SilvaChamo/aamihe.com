'use client';

import {
  PanelActivitySkeleton,
  PanelPageHeaderSkeleton,
  PanelStatsSkeleton,
} from '@/components/Admin/PanelSkeleton';

export function AdminPanelLoading({ variant = 'default' }: { variant?: 'default' | 'dashboard' }) {
  if (variant === 'dashboard') {
    return (
      <div className="dashboard-container admin-panel-loading">
        <PanelPageHeaderSkeleton withAction={false} />
        <div className="dashboard-main-content" style={{ marginTop: 24 }}>
          <div className="dashboard-content-grid">
            <div className="dashboard-card" style={{ padding: 20 }}>
              <PanelActivitySkeleton count={4} />
            </div>
            <PanelStatsSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-loading" style={{ padding: '8px 4px' }}>
      <PanelPageHeaderSkeleton />
    </div>
  );
}
