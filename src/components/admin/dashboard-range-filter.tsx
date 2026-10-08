import React from 'react';
import Link from 'next/link';
import styles from './dashboard-range-filter.module.css';
import type { DashboardTimeRange } from '@/lib/validation/analytics-schema';

export interface DashboardRangeFilterProps {
  currentRange: DashboardTimeRange;
  baseUrl?: string;
}

const RANGES: { key: DashboardTimeRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
];

export const DashboardRangeFilter: React.FC<DashboardRangeFilterProps> = ({
  currentRange,
  baseUrl = '/admin',
}) => {
  return (
    <nav className={styles.container} aria-label="Dashboard Time Range Selector">
      <span className={styles.label}>Time Period:</span>
      <div className={styles.buttonGroup} role="group" aria-label="Time period options">
        {RANGES.map((r) => {
          const isSelected = currentRange === r.key;
          const href = `${baseUrl}?range=${r.key}`;

          return (
            <Link
              key={r.key}
              href={href}
              className={`${styles.filterButton} ${isSelected ? styles.selected : ''}`}
              aria-current={isSelected ? 'true' : undefined}
            >
              {r.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

DashboardRangeFilter.displayName = 'DashboardRangeFilter';
