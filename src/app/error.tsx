'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for diagnostics
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: 'var(--space-6)',
      }}
    >
      <ErrorState
        title="We encountered an unexpected error"
        message="Something went wrong while loading this page. Please try refreshing or return to the home screen."
        onRetry={reset}
        retryText="Retry"
      />
    </div>
  );
}
