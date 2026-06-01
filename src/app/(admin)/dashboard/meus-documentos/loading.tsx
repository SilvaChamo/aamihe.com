import { PanelDocumentsGridSkeleton, PanelPageHeaderSkeleton } from '@/components/Admin/PanelSkeleton';

export default function MeusDocumentosLoading() {
  return (
    <div className="docs-admin-page">
      <PanelPageHeaderSkeleton withAction />
      <div className="docs-admin-container">
        <PanelDocumentsGridSkeleton count={6} />
      </div>
    </div>
  );
}
