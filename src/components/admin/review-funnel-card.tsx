import React from 'react';
import { ArrowRight, Info, Filter } from 'lucide-react';
import styles from './review-funnel-card.module.css';

export interface ReviewFunnelCardProps {
  qrScans: number;
  googleReviewClicks: number;
  clickRate: number | null;
}

/**
 * Visual funnel displaying conversion from physical QR scan to Google Review button click.
 * Accurately communicates click-through rate without claiming verified Google submissions.
 */
export const ReviewFunnelCard: React.FC<ReviewFunnelCardProps> = ({
  qrScans,
  googleReviewClicks,
  clickRate,
}) => {
  return (
    <div className={styles.container} aria-label="Google Review Conversion Funnel">
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Filter size={18} color="var(--color-primary)" aria-hidden="true" />
          <span>Google Review Click Funnel</span>
        </h2>
        <p className={styles.subtitle}>
          Tracks customer journey from QR code entry to clicking &quot;Copy &amp; Continue to Google&quot;.
        </p>
      </div>

      <div className={styles.funnelRow}>
        <div className={styles.stage}>
          <span className={styles.stageLabel}>1. QR Scans</span>
          <span className={styles.stageValue}>{qrScans.toLocaleString()}</span>
        </div>

        <span className={styles.arrow} aria-hidden="true">
          <ArrowRight size={18} />
        </span>

        <div className={styles.stage}>
          <span className={styles.stageLabel}>2. Google Review Clicks</span>
          <span className={styles.stageValue} style={{ color: 'var(--color-primary)' }}>
            {googleReviewClicks.toLocaleString()}
          </span>
        </div>

        <span className={styles.arrow} aria-hidden="true">
          =
        </span>

        <div className={styles.rateStage}>
          <span className={styles.rateLabel}>Click-Through Rate</span>
          <span className={styles.rateValue}>
            {clickRate !== null ? `${clickRate}%` : 'No QR data'}
          </span>
        </div>
      </div>

      <p className={styles.disclaimer}>
        <Info size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} aria-hidden="true" />
        <strong>Handoff note:</strong> This rate measures customers who reached and clicked the Google handoff CTA. The pharmacy application does not control or scrape Google&apos;s interface to confirm whether reviews were posted.
      </p>
    </div>
  );
};

ReviewFunnelCard.displayName = 'ReviewFunnelCard';
