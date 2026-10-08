import React from 'react';
import styles from './error-state.module.css';
import { Button } from './button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.container} ${className}`} role="alert" {...props}>
      <div className={styles.iconSlot} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{message}</p>
      {onRetry && (
        <div className={styles.actionSlot}>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onRetry}
          >
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';
