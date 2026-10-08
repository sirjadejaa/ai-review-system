'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ShareCardButtonProps {
  shopName: string;
}

/**
 * Lightweight, privacy-preserving card sharing button.
 * Uses the native Web Share API on mobile devices with a safe clipboard copy fallback.
 * Strictly collects zero analytics, zero customer identity, and zero tracking data.
 */
export const ShareCardButton: React.FC<ShareCardButtonProps> = ({ shopName }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const currentUrl = window.location.href;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${shopName} • Digital Customer Card`,
          text: `Contact numbers, operating hours, and offers for ${shopName}`,
          url: currentUrl,
        });
        return;
      } catch (err) {
        // User dismissed share sheet or aborted; do not treat as error
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback: Copy link to clipboard
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Safe no-op on restricted clipboard
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      aria-label={`Share ${shopName} digital card`}
    >
      {copied ? (
        <Check size={14} color="var(--color-primary)" aria-hidden="true" />
      ) : (
        <Share2 size={14} aria-hidden="true" />
      )}
      <span>{copied ? 'Link Copied!' : 'Share Card'}</span>
    </Button>
  );
};

ShareCardButton.displayName = 'ShareCardButton';
