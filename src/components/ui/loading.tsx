import React from 'react';
import styles from './loading.module.css';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'inverse' | 'muted';
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  label = 'Loading...',
  className = '',
  ...props
}) => {
  const classNames = [styles.spinner, styles[size], styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span role="status" aria-live="polite">
      <svg
        className={classNames}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
};
Spinner.displayName = 'Spinner';

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: string | number;
  height?: string | number;
  radius?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  radius = 'md',
  style,
  className = '',
  ...props
}) => {
  const radiusClass =
    radius === 'sm'
      ? styles.radiusSm
      : radius === 'lg'
      ? styles.radiusLg
      : radius === 'full'
      ? styles.radiusFull
      : styles.radiusMd;

  const inlineStyles: React.CSSProperties = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : '1rem',
  };

  return (
    <span
      className={`${styles.skeleton} ${radiusClass} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';
