import {
  PanelNotificationsListSkeleton,
  PanelPageHeaderSkeleton,
} from '@/components/Admin/PanelSkeleton';

export default function NotificacoesLoading() {
  return (
    <div className="docs-admin-page">
      <PanelPageHeaderSkeleton withAction />
      <div className="docs-admin-container">
        <PanelNotificationsListSkeleton count={4} />
      </div>
    </div>
  );
}
