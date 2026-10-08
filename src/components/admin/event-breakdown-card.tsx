import React from 'react';
import { PieChart, QrCode, Star, Phone, MessageCircle, MapPin, Tag } from 'lucide-react';
import styles from './event-breakdown-card.module.css';
import { EmptyState } from '@/components/ui/empty-state';
import type { EventCountsSummary, QRSourceBreakdownItem } from '@/lib/repositories/analytics-repository';

export interface EventBreakdownCardProps {
  counts: EventCountsSummary;
  qrSources: QRSourceBreakdownItem[];
  periodLabel?: string;
}

export const EventBreakdownCard: React.FC<EventBreakdownCardProps> = ({
  counts,
  qrSources,
  periodLabel = 'Selected Period',
}) => {
  if (counts.totalEngagements === 0) {
    return (
      <div className={styles.container} aria-label="Event Breakdown">
        <div className={styles.header}>
          <h2 className={styles.title}>
            <PieChart size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>Customer Interaction Breakdown</span>
          </h2>
          <p className={styles.subtitle}>Volume by action category and QR placement for {periodLabel}.</p>
        </div>
        <EmptyState
          title="No Interaction Data"
          description={`No customer interactions recorded for ${periodLabel.toLowerCase()}. Events will populate as customers scan and click.`}
        />
      </div>
    );
  }

  const actions = [
    {
      icon: <QrCode size={15} color="var(--color-primary)" />,
      label: 'QR Scans',
      count: counts.qrScans,
      pct: counts.totalEngagements > 0 ? Math.round((counts.qrScans / counts.totalEngagements) * 100) : 0,
    },
    {
      icon: <Star size={15} color="var(--color-primary)" />,
      label: 'Google Review Clicks',
      count: counts.googleReviewClicks,
      pct: counts.totalEngagements > 0 ? Math.round((counts.googleReviewClicks / counts.totalEngagements) * 100) : 0,
    },
    {
      icon: <Phone size={15} color="var(--color-text-primary)" />,
      label: 'Call Clicks',
      count: counts.callClicks,
      pct: counts.totalEngagements > 0 ? Math.round((counts.callClicks / counts.totalEngagements) * 100) : 0,
    },
    {
      icon: <MessageCircle size={15} color="var(--color-secondary)" />,
      label: 'WhatsApp Clicks',
      count: counts.whatsappClicks,
      pct: counts.totalEngagements > 0 ? Math.round((counts.whatsappClicks / counts.totalEngagements) * 100) : 0,
    },
    {
      icon: <MapPin size={15} color="var(--color-text-primary)" />,
      label: 'Directions Clicks',
      count: counts.directionsClicks,
      pct: counts.totalEngagements > 0 ? Math.round((counts.directionsClicks / counts.totalEngagements) * 100) : 0,
    },
  ];

  return (
    <div className={styles.container} aria-label="Customer Interaction Breakdown">
      <div className={styles.header}>
        <h2 className={styles.title}>
          <PieChart size={18} color="var(--color-primary)" aria-hidden="true" />
          <span>Customer Interaction Breakdown</span>
        </h2>
        <p className={styles.subtitle}>
          Relative share of customer actions and QR placements for {periodLabel}.
        </p>
      </div>

      <div className={styles.grid}>
        {/* Actions Breakdown */}
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Actions Initiated</h3>
          <div className={styles.list} role="list" aria-label="Actions breakdown list">
            {actions.map((act) => (
              <div key={act.label} className={styles.itemRow} role="listitem">
                <span className={styles.itemLabel}>
                  <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {act.icon}
                  </span>
                  <span>{act.label}</span>
                </span>
                <span className={styles.itemCount}>
                  <span>{act.count.toLocaleString()}</span>
                  <span className={styles.percentTag}>({act.pct}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QR Source Placements */}
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>QR Placement Source</h3>
          {qrSources.length > 0 ? (
            <div className={styles.list} role="list" aria-label="QR placements list">
              {qrSources.map((item) => (
                <div key={item.source} className={styles.itemRow} role="listitem">
                  <span className={styles.itemLabel}>
                    <Tag size={15} color="var(--color-secondary)" aria-hidden="true" />
                    <span style={{ textTransform: 'capitalize' }}>{item.source}</span>
                  </span>
                  <span className={styles.itemCount}>
                    <span>{item.count.toLocaleString()}</span>
                    <span className={styles.percentTag}>({item.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
              No QR scans tracked yet for this period.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

EventBreakdownCard.displayName = 'EventBreakdownCard';
