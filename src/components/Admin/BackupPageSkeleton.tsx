export default function BackupPageSkeleton() {
  const blockStyle = { background: '#e6e7e8', borderRadius: 4 } as const;

  return (
    <div style={{ padding: 24, background: '#f0f0f1', minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...blockStyle, height: 100 }} />
        <div style={{ ...blockStyle, height: 220 }} />
        <div style={{ ...blockStyle, height: 260 }} />
        <div style={{ ...blockStyle, height: 190 }} />
      </div>
    </div>
  );
}
