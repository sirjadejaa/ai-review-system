'use client';

import React, { useState } from 'react';
import styles from './offer-list.module.css';
import { Badge } from '@/components/ui/badge';
import type { DomainOffer } from '@/lib/domain/types';
import { useLanguage } from '@/lib/i18n/context';
import { Tag, Sparkles, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export interface OfferListProps {
  offers: DomainOffer[];
}

function formatValidUntil(date: Date | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export const OfferList: React.FC<OfferListProps> = ({ offers }) => {
  const { t } = useLanguage();
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  if (!offers || offers.length === 0) {
    return null;
  }

  const toggleTerms = (id: string) => {
    setExpandedTerms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className={styles.container} aria-label="Boutique Special Offers">
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          <Sparkles size={20} color="var(--color-accent, #a88b64)" aria-hidden="true" />
          <span>{t.specialOffersTitle}</span>
        </h2>
        <Badge variant="primary" size="sm">
          {offers.length} {offers.length === 1 ? 'Active Deal' : 'Active Deals'}
        </Badge>
      </div>

      <div className={styles.offerGrid}>
        {offers.map((offer) => {
          const expiryText = formatValidUntil(offer.validUntil);
          const isTermsOpen = Boolean(expandedTerms[offer.id]);

          return (
            <article key={offer.id} className={styles.offerCard}>
              {offer.imageUrl && (
                <div className={styles.bannerWrapper}>
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    loading="lazy"
                    className={styles.bannerImage}
                  />
                  {offer.discountInfo && (
                    <span className={styles.discountPill}>{offer.discountInfo}</span>
                  )}
                </div>
              )}

              <div className={styles.body}>
                <div className={styles.offerTopRow}>
                  <h3 className={styles.offerTitle}>{offer.title}</h3>
                  {offer.badge && !offer.imageUrl && (
                    <Badge variant="warning" size="sm">
                      {offer.badge}
                    </Badge>
                  )}
                </div>

                {offer.description && (
                  <p className={styles.offerDescription}>{offer.description}</p>
                )}

                {offer.terms && (
                  <div>
                    <button
                      type="button"
                      className={styles.termsToggle}
                      onClick={() => toggleTerms(offer.id)}
                      aria-expanded={isTermsOpen}
                    >
                      {t.offerTerms} {isTermsOpen ? '▲' : '▼'}
                    </button>
                    {isTermsOpen && (
                      <div className={styles.termsContent}>{offer.terms}</div>
                    )}
                  </div>
                )}

                <div className={styles.offerFooter}>
                  {expiryText ? (
                    <span className={styles.expiryBadge} aria-label={`${t.validTill} ${expiryText}`}>
                      <span>⏳</span>
                      <span>{t.validTill} {expiryText}</span>
                    </span>
                  ) : (
                    <span className={styles.expiryBadge}>
                      <span>✨</span>
                      <span>Special Privilege</span>
                    </span>
                  )}

                  {offer.offerUrl && (
                    <a
                      href={offer.offerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.offerLink}
                    >
                      <span>{t.claimOffer}</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default OfferList;
