import { Spinner } from '@/components/ui';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 'var(--space-4)',
        padding: 'var(--space-8)',
      }}
    >
      <Spinner size="lg" variant="primary" label="Loading content..." />
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Please wait a moment...
      </p>
    </div>
  );
}
