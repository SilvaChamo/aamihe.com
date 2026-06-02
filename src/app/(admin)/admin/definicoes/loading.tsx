import '@/components/Admin/panel-skeleton.css';

export default function DefinicoesLoading() {
  return (
    <div className="settings-container" aria-busy="true" aria-label="A carregar definições">
      <div className="settings-header panel-skeleton-header wp-skeleton-pulse">
        <div className="panel-skeleton-block">
          <div className="panel-skeleton-title" />
          <div className="panel-skeleton-intro" />
        </div>
        <div className="panel-skeleton-btn" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="wp-skeleton-pulse"
            style={{ height: i === 0 ? 180 : 220, background: '#e6e7e8', borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  );
}
