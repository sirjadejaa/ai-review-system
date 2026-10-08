import React from 'react';
import styles from './badge.module.css';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  hasDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  hasDot = false,
  className = '',
  ...props
}) => {
  const classNames = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {hasDot && <span className={styles.dot} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

Badge.displayName = 'Badge';
