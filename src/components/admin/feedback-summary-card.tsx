import React from 'react';
import { Star } from 'lucide-react';
import styles from './feedback-summary-card.module.css';
import { Rating } from '@/components/ui/rating';
import { EmptyState } from '@/components/ui/empty-state';
import type { FeedbackDashboardSummary } from '@/lib/repositories/feedback-repository';

export interface FeedbackSummaryCardProps {
  summary: FeedbackDashboardSummary;
  periodLabel?: string;
}

export const FeedbackSummaryCard: React.FC<FeedbackSummaryCardProps> = ({
  summary,
  periodLabel = 'Selected Period',
}) => {
  if (summary.total === 0) {
    return (
      <div className={styles.container} aria-label="Customer Feedback & Rating Summary">
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              <Star size={18} color="var(--color-primary)" aria-hidden="true" />
              <span>Customer Feedback & Ratings</span>
            </h2>
            <p className={styles.subtitle}>Sentiment distribution for {periodLabel}.</p>
          </div>
        </div>
        <EmptyState
          title="No Feedback Records Yet"
          description={`Customers haven't submitted private feedback for ${periodLabel.toLowerCase()}. Rating analytics will appear here once responses arrive.`}
        />
      </div>
    );
  }

  const ratingsOrder: (5 | 4 | 3 | 2 | 1)[] = [5, 4, 3, 2, 1];

  return (
    <div className={styles.container} aria-label="Customer Feedback & Rating Summary">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <Star size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>Customer Feedback & Ratings</span>
          </h2>
          <p className={styles.subtitle}>
            Rating distribution and average satisfaction score for {periodLabel}.
          </p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.scoreColumn}>
          <div className={styles.avgNumber}>
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '0.0'}
          </div>
          <div className={styles.avgScale}>out of 5 stars</div>
          <Rating value={Math.round(summary.averageRating)} isReadOnly size="sm" />
          <p className={styles.totalSubmissions}>
            {summary.total} {summary.total === 1 ? 'submission' : 'submissions'}
            {summary.newCount > 0 && ` • ${summary.newCount} new`}
          </p>
        </div>

        <div className={styles.barsColumn} role="list" aria-label="Rating breakdown">
          {ratingsOrder.map((stars) => {
            const count = summary.distribution[stars] || 0;
            const percent = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;

            return (
              <div
                key={stars}
                className={styles.distRow}
                role="listitem"
                aria-label={`${stars} stars: ${count} submissions (${percent}%)`}
              >
                <span className={styles.starLabel}>{stars} ★</span>
                <div className={styles.track} aria-hidden="true">
                  <div className={styles.fill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.countLabel}>
                  {count} <span style={{ opacity: 0.6 }}>({percent}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

FeedbackSummaryCard.displayName = 'FeedbackSummaryCard';
