import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
        }}
        aria-hidden="true"
      >
        404
      </div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>
        Page Not Found
      </h1>
      <p
        style={{
          color: 'var(--color-text-muted)',
          maxWidth: '400px',
          marginBottom: 'var(--space-6)',
        }}
      >
        The pharmacy page or QR destination you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="primary">Return Home</Button>
      </Link>
    </div>
  );
}
