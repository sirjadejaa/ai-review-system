import React from 'react';
import styles from './empty-state.module.css';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.container} ${className}`} role="region" {...props}>
      {icon && <div className={styles.iconSlot}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionSlot}>{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
