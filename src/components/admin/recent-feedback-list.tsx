import React from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import styles from './recent-feedback-list.module.css';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { DashboardRecentFeedbackItem } from '@/lib/repositories/feedback-repository';

export interface RecentFeedbackListProps {
  items: DashboardRecentFeedbackItem[];
  allFeedbackHref?: string;
}

export const RecentFeedbackList: React.FC<RecentFeedbackListProps> = ({
  items,
  allFeedbackHref = '/admin/reviews',
}) => {
  if (items.length === 0) {
    return (
      <div className={styles.container} aria-label="Recent Customer Feedback">
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 className={styles.title}>
              <MessageSquare size={18} color="var(--color-primary)" aria-hidden="true" />
              <span>Recent Customer Feedback</span>
            </h2>
            <p className={styles.subtitle}>Latest responses received from visiting customers.</p>
          </div>
        </div>
        <EmptyState
          title="No Recent Feedback"
          description="Customer responses and ratings will appear here as soon as feedback is submitted."
        />
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string): 'warning' | 'info' | 'success' | 'neutral' => {
    switch (status) {
      case 'NEW':
        return 'warning';
      case 'REVIEWED':
        return 'info';
      case 'RESOLVED':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className={styles.container} aria-label="Recent Customer Feedback">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>
            <MessageSquare size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>Recent Customer Feedback</span>
          </h2>
          <p className={styles.subtitle}>
            Showing latest {items.length} {items.length === 1 ? 'entry' : 'entries'} (privacy-filtered).
          </p>
        </div>

        <Link href={allFeedbackHref} className={styles.viewAllLink}>
          View All Feedback →
        </Link>
      </div>

      <div className={styles.list} role="list" aria-label="Recent feedback items">
        {items.map((item) => {
          const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div key={item.id} className={styles.card} role="listitem">
              <div className={styles.cardTop}>
                <div className={styles.metaRow}>
                  <Rating value={item.rating} isReadOnly size="sm" />
                  <span className={styles.date}>{dateStr}</span>
                </div>
                <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                  {item.status}
                </Badge>
              </div>

              {item.tags.length > 0 && (
                <div className={styles.tagsRow}>
                  {item.tags.map((t) => (
                    <Badge key={t} variant="neutral" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {item.notes && <p className={styles.notes}>{item.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

RecentFeedbackList.displayName = 'RecentFeedbackList';
