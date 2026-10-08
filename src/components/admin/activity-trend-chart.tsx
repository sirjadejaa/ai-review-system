import React from 'react';
import { TrendingUp } from 'lucide-react';
import styles from './activity-trend-chart.module.css';
import { EmptyState } from '@/components/ui/empty-state';
import type { DayActivityPoint } from '@/lib/repositories/analytics-repository';

export interface ActivityTrendChartProps {
  points: DayActivityPoint[];
  periodLabel?: string;
}

/**
 * Responsive, accessible CSS/SVG daily engagement activity trend chart.
 * Requires zero heavy chart libraries and adheres strictly to the design system.
 */
export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  points,
  periodLabel = 'Selected Period',
}) => {
  const totalVolume = points.reduce((sum, p) => sum + p.total, 0);

  if (totalVolume === 0 || points.length === 0) {
    return (
      <div className={styles.container} aria-label="Customer Engagement Trend">
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              <TrendingUp size={18} color="var(--color-primary)" aria-hidden="true" />
              <span>Daily Customer Activity Trend</span>
            </h2>
            <p className={styles.subtitle}>Daily interaction volume for {periodLabel}.</p>
          </div>
        </div>
        <EmptyState
          title="No Activity Recorded"
          description={`No customer QR scans or interactions recorded for ${periodLabel.toLowerCase()}. Activity will populate automatically as customers interact.`}
        />
      </div>
    );
  }

  // Calculate highest daily total to scale bars correctly
  const maxDaily = Math.max(...points.map((p) => p.total), 1);

  // Pick first and last label for axis boundaries
  const firstLabel = points[0]?.label || '';
  const midLabel = points[Math.floor(points.length / 2)]?.label || '';
  const lastLabel = points[points.length - 1]?.label || '';

  return (
    <div className={styles.container} aria-label="Daily Customer Activity Trend">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <TrendingUp size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>Daily Customer Activity Trend</span>
          </h2>
          <p className={styles.subtitle}>
            Total interactions: {totalVolume.toLocaleString()} across {points.length} {points.length === 1 ? 'day' : 'days'}.
          </p>
        </div>

        <div className={styles.legend} role="list" aria-label="Chart Legend">
          <div className={styles.legendItem} role="listitem">
            <span className={styles.legendColor} style={{ backgroundColor: 'var(--color-info)' }} aria-hidden="true" />
            <span>QR Scans</span>
          </div>
          <div className={styles.legendItem} role="listitem">
            <span className={styles.legendColor} style={{ backgroundColor: 'var(--color-primary)' }} aria-hidden="true" />
            <span>Google Clicks</span>
          </div>
          <div className={styles.legendItem} role="listitem">
            <span className={styles.legendColor} style={{ backgroundColor: 'var(--color-warning)' }} aria-hidden="true" />
            <span>Contact Actions</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <div
          className={styles.chartContainer}
          role="img"
          aria-label={`Activity trend chart showing ${totalVolume} total events from ${firstLabel} to ${lastLabel}`}
        >
          {points.map((pt) => {
            const heightPercent = pt.total > 0 ? Math.max((pt.total / maxDaily) * 100, 6) : 0;
            const qrPercent = pt.total > 0 ? (pt.qrScans / pt.total) * 100 : 0;
            const reviewPercent = pt.total > 0 ? (pt.googleReviewClicks / pt.total) * 100 : 0;
            const contactPercent = pt.total > 0 ? (pt.contactClicks / pt.total) * 100 : 0;

            const accessibleLabel = `${pt.label}: ${pt.total} events (${pt.qrScans} QR scans, ${pt.googleReviewClicks} review clicks, ${pt.contactClicks} contact actions)`;

            return (
              <div
                key={pt.dateKey}
                tabIndex={0}
                className={styles.barCol}
                aria-label={accessibleLabel}
              >
                <div
                  className={styles.barGroup}
                  style={{ height: `${heightPercent}%` }}
                >
                  {qrPercent > 0 && (
                    <div
                      className={styles.segmentQr}
                      style={{ height: `${qrPercent}%` }}
                    />
                  )}
                  {reviewPercent > 0 && (
                    <div
                      className={styles.segmentReview}
                      style={{ height: `${reviewPercent}%` }}
                    />
                  )}
                  {contactPercent > 0 && (
                    <div
                      className={styles.segmentContact}
                      style={{ height: `${contactPercent}%` }}
                    />
                  )}
                </div>

                <div className={styles.tooltip} role="tooltip">
                  <strong>{pt.label}</strong>: {pt.total} total
                  {pt.qrScans > 0 && ` • ${pt.qrScans} scans`}
                  {pt.googleReviewClicks > 0 && ` • ${pt.googleReviewClicks} reviews`}
                  {pt.contactClicks > 0 && ` • ${pt.contactClicks} contacts`}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.axisLabels} aria-hidden="true">
          <span>{firstLabel}</span>
          {points.length > 7 && <span>{midLabel}</span>}
          <span>{lastLabel}</span>
        </div>
      </div>
    </div>
  );
};

ActivityTrendChart.displayName = 'ActivityTrendChart';
