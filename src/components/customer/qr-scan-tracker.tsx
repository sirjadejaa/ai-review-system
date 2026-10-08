'use client';

import { useEffect, useRef } from 'react';
import { trackQrScanAction } from '@/lib/actions/customer-actions';
import { VALID_QR_SOURCES, type ValidQrSource } from '@/lib/validation/customer-query-schema';

export interface QrScanTrackerProps {
  source?: string;
}

/**
 * Client-side QR scan tracker.
 * Ensures that repeat renders, React StrictMode mounts, or page refreshes
 * within the same tab session do not generate duplicate QR_SCAN records.
 */
export function QrScanTracker({ source }: QrScanTrackerProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!source) return;
    if (hasTriggeredRef.current) return;
    if (!VALID_QR_SOURCES.includes(source as ValidQrSource)) return;

    const storageKey = `pharmacy_qr_scan_${source}`;
    try {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, 'true');
    } catch {
      // sessionStorage might be restricted in private browsing mode
    }

    hasTriggeredRef.current = true;
    void trackQrScanAction(source).catch(() => {});
  }, [source]);

  return null;
}
