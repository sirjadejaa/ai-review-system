import React from 'react';
import Link from 'next/link';
import styles from './analytics-tabs.module.css';

export type AnalyticsTab = 'overview' | 'qr' | 'reviews' | 'calls' | 'whatsapp' | 'directions';

export interface AnalyticsTabsProps {
  currentTab: AnalyticsTab;
  currentRange: string;
}

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'qr', label: 'QR Scans' },
  { id: 'reviews', label: 'Review Clicks' },
  { id: 'calls', label: 'Call Clicks' },
  { id: 'whatsapp', label: 'WhatsApp Clicks' },
  { id: 'directions', label: 'Directions' },
];

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({ currentTab, currentRange }) => {
  return (
    <div className={styles.container} role="tablist" aria-label="Analytics Section Tabs">
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        const href = `/admin/analytics?range=${currentRange}&tab=${tab.id}`;

        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

AnalyticsTabs.displayName = 'AnalyticsTabs';
