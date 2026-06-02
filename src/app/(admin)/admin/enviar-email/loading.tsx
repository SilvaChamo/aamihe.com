import { PanelPageHeaderSkeleton } from '@/components/Admin/PanelSkeleton';

export default function EnviarEmailLoading() {
  return (
    <div className="news-form-container email-send-page" aria-busy="true" aria-label="A carregar">
      <PanelPageHeaderSkeleton withAction={false} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="wp-skeleton-pulse"
            style={{ height: i === 3 ? 120 : 44, background: '#e6e7e8', borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  );
}
