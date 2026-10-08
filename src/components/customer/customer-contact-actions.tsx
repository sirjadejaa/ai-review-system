'use client';

import React from 'react';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import styles from './customer-contact-actions.module.css';
import { trackContactClickAction } from '@/lib/actions/customer-actions';
import { formatTelHref, formatWhatsAppHref, isValidExternalUrl } from '@/lib/format/contact-links';

export interface CustomerContactActionsProps {
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  googleMapsUrl?: string | null;
}

/**
 * Customer contact and navigation action buttons (Call, WhatsApp, Directions).
 * Features touch-friendly targets (>= 48px), accessible labels, and non-blocking analytics.
 */
export const CustomerContactActions: React.FC<CustomerContactActionsProps> = ({
  phoneNumber,
  whatsappNumber,
  googleMapsUrl,
}) => {
  const telHref = formatTelHref(phoneNumber);
  const whatsAppHref = formatWhatsAppHref(whatsappNumber);
  const hasPhone = Boolean(telHref);
  const hasWhatsApp = Boolean(whatsAppHref);
  const hasDirections = Boolean(googleMapsUrl && isValidExternalUrl(googleMapsUrl));

  if (!hasPhone && !hasWhatsApp && !hasDirections) {
    return null;
  }

  const handleAction = (eventType: 'CALL_CLICK' | 'WHATSAPP_CLICK' | 'DIRECTIONS_CLICK') => {
    // Non-blocking analytics: link navigation proceeds immediately
    void trackContactClickAction(eventType).catch(() => {});
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Contact &amp; Location</h2>
      <div className={styles.actionGrid}>
        {hasPhone && (
          <a
            href={telHref}
            onClick={() => handleAction('CALL_CLICK')}
            className={styles.actionButton}
            aria-label={`Call pharmacy at ${phoneNumber}`}
          >
            <Phone size={16} className={styles.actionIcon} />
            <span>Call</span>
          </a>
        )}

        {hasWhatsApp && (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleAction('WHATSAPP_CLICK')}
            className={styles.actionButton}
            aria-label={`Chat with pharmacy on WhatsApp at ${whatsappNumber}`}
          >
            <MessageCircle size={16} className={styles.actionIcon} />
            <span>WhatsApp</span>
          </a>
        )}

        {hasDirections && (
          <a
            href={googleMapsUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleAction('DIRECTIONS_CLICK')}
            className={styles.actionButton}
            aria-label="Get directions to the pharmacy on Google Maps"
          >
            <MapPin size={16} className={styles.actionIcon} />
            <span>Directions</span>
          </a>
        )}
      </div>
    </div>
  );
};

CustomerContactActions.displayName = 'CustomerContactActions';

