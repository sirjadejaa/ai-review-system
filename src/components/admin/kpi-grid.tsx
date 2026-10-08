import React from 'react';
import { QrCode, Star, MessageSquareQuote, Phone, MessageCircle, MapPin } from 'lucide-react';
import styles from './kpi-grid.module.css';
import type { EventCountsSummary } from '@/lib/repositories/analytics-repository';

export interface KpiGridProps {
  counts: EventCountsSummary;
  totalFeedback: number;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ counts, totalFeedback }) => {
  const cards = [
    {
      title: 'QR Scans',
      value: counts.qrScans,
      icon: <QrCode size={18} strokeWidth={2} />,
      subtitle: 'Customer scans across all placement sources',
      color: 'var(--color-primary)',
      iconBg: 'rgba(18, 62, 53, 0.08)',
      iconColor: 'var(--color-primary)',
    },
    {
      title: 'Google Review Clicks',
      value: counts.googleReviewClicks,
      icon: <Star size={18} strokeWidth={2} />,
      subtitle: 'Handoff clicks to public Google Reviews page',
      color: 'var(--color-primary)',
      iconBg: 'rgba(18, 62, 53, 0.08)',
      iconColor: 'var(--color-primary)',
    },
    {
      title: 'Customer Feedback',
      value: totalFeedback,
      icon: <MessageSquareQuote size={18} strokeWidth={2} />,
      subtitle: 'Private feedback entries received from customers',
      color: 'var(--color-secondary)',
      iconBg: 'rgba(74, 107, 97, 0.1)',
      iconColor: 'var(--color-secondary)',
    },
    {
      title: 'Call Clicks',
      value: counts.callClicks,
      icon: <Phone size={18} strokeWidth={2} />,
      subtitle: 'Direct phone call initiations from landing & card',
      color: 'var(--color-text-primary)',
      iconBg: 'var(--color-bg-surface-subtle)',
      iconColor: 'var(--color-text-primary)',
    },
    {
      title: 'WhatsApp Clicks',
      value: counts.whatsappClicks,
      icon: <MessageCircle size={18} strokeWidth={2} />,
      subtitle: 'WhatsApp chat initiations for orders & queries',
      color: 'var(--color-primary)',
      iconBg: 'rgba(18, 62, 53, 0.08)',
      iconColor: 'var(--color-primary)',
    },
    {
      title: 'Directions Clicks',
      value: counts.directionsClicks,
      icon: <MapPin size={18} strokeWidth={2} />,
      subtitle: 'Google Maps navigation clicks to store address',
      color: 'var(--color-text-primary)',
      iconBg: 'var(--color-bg-surface-subtle)',
      iconColor: 'var(--color-text-primary)',
    },
  ];

  return (
    <div className={styles.grid} aria-label="Key Performance Indicators">
      {cards.map((card) => (
        <div key={card.title} className={styles.kpiCard}>
          <div className={styles.topRow}>
            <span className={styles.title}>{card.title}</span>
            <div
              className={styles.iconWrapper}
              style={{ backgroundColor: card.iconBg, color: card.iconColor }}
              aria-hidden="true"
            >
              {card.icon}
            </div>
          </div>

          <div className={styles.valueRow}>
            <span className={styles.value} style={{ color: card.color }}>
              {card.value.toLocaleString()}
            </span>
          </div>

          <p className={styles.subtitle}>{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
};

KpiGrid.displayName = 'KpiGrid';
