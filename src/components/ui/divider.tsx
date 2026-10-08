import React from 'react';
import styles from './divider.module.css';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className = '',
  ...props
}) => {
  if (label && orientation === 'horizontal') {
    return (
      <div className={`${styles.withLabel} ${className}`} role="separator" {...props}>
        <span className={styles.label}>{label}</span>
      </div>
    );
  }

  return (
    <hr
      className={`${styles.divider} ${styles[orientation]} ${className}`}
      aria-orientation={orientation}
      {...(props as React.HTMLAttributes<HTMLHRElement>)}
    />
  );
};

Divider.displayName = 'Divider';
