import React from 'react';
import styles from './offer-list.module.css';
import { Badge } from '@/components/ui/badge';
import type { DomainOffer } from '@/lib/domain/types';

export interface OfferListProps {
  offers: DomainOffer[];
}

/**
 * Formats offer validity date safely into clean human-readable text.
 * Resilient against invalid or malformed dates.
 */
function formatValidUntil(date: Date | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Read-only display of active pharmacy offers & deals on the Digital Customer Card.
 * Hides completely if no active offers exist.
 * Renders all text safely without dangerous HTML evaluation.
 */
export const OfferList: React.FC<OfferListProps> = ({ offers }) => {
  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className={styles.container} aria-label="Current Pharmacy Offers">
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <span aria-hidden="true">🏷️</span>
          <span>Current Pharmacy Offers</span>
        </h2>
        <Badge variant="primary" size="sm">
          {offers.length} Active {offers.length === 1 ? 'Offer' : 'Offers'}
        </Badge>
      </div>

      <div className={styles.offerGrid}>
        {offers.map((offer) => {
          const expiryText = formatValidUntil(offer.validUntil);

          return (
            <div key={offer.id} className={styles.offerCard}>
              <div className={styles.offerTopRow}>
                <h3 className={styles.offerTitle}>{offer.title}</h3>
                {offer.badge && (
                  <Badge variant="warning" size="sm">
                    {offer.badge}
                  </Badge>
                )}
              </div>

              {offer.description && (
                <p className={styles.offerDescription}>{offer.description}</p>
              )}

              {expiryText && (
                <div className={styles.offerFooter}>
                  <span className={styles.expiryBadge} aria-label={`Offer valid until ${expiryText}`}>
                    <span aria-hidden="true">⏳</span>
                    <span>Valid until {expiryText}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

OfferList.displayName = 'OfferList';
