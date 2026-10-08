'use server';

import { cookies } from 'next/headers';
import { trackAnalyticsEvent } from '@/lib/repositories/analytics-repository';
import { VALID_QR_SOURCES, type ValidQrSource } from '@/lib/validation/customer-query-schema';
import { z } from 'zod';

const QR_TRACKED_COOKIE = 'qr_scanned_session';

const ContactEventTypeSchema = z.enum([
  'CALL_CLICK',
  'WHATSAPP_CLICK',
  'DIRECTIONS_CLICK',
]);

export type ContactEventType = z.infer<typeof ContactEventTypeSchema>;

/**
 * Tracks a QR scan event when a customer lands via a valid QR source.
 * Prevents duplicate counts on browser refresh or repeat renders.
 * Guaranteed not to throw or interrupt the customer experience.
 */
export async function trackQrScanAction(rawSource?: string): Promise<{ success: boolean; recorded: boolean }> {
  try {
    if (!rawSource || !VALID_QR_SOURCES.includes(rawSource as ValidQrSource)) {
      return { success: false, recorded: false };
    }

    const cookieStore = await cookies();
    if (cookieStore.get(QR_TRACKED_COOKIE)?.value === 'true') {
      // Already tracked during this browsing session
      return { success: true, recorded: false };
    }

    await trackAnalyticsEvent({
      eventType: 'QR_SCAN',
      source: rawSource,
    });

    // Mark session cookie to prevent repeat counting on refresh
    cookieStore.set(QR_TRACKED_COOKIE, 'true', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600, // 1 hour sliding session window
    });

    return { success: true, recorded: true };
  } catch (error) {
    console.error('Non-fatal: Failed to track QR scan event', error);
    return { success: false, recorded: false };
  }
}

/**
 * Tracks customer contact button clicks (Call, WhatsApp, Directions).
 * Guaranteed not to block link navigation or throw errors.
 */
export async function trackContactClickAction(rawEventType: string): Promise<{ success: boolean }> {
  try {
    const parsed = ContactEventTypeSchema.safeParse(rawEventType);
    if (!parsed.success) {
      return { success: false };
    }

    await trackAnalyticsEvent({
      eventType: parsed.data,
      source: 'customer_landing',
    });

    return { success: true };
  } catch (error) {
    console.error('Non-fatal: Failed to track contact click event', error);
    return { success: false };
  }
}

/**
 * Tracks customer click on the Google Review handoff CTA.
 * Non-blocking: will never prevent or delay Google navigation.
 * Guaranteed not to claim or imply that a review was submitted on Google.
 */
export async function trackGoogleReviewClickAction(
  rawSource?: string
): Promise<{ success: boolean }> {
  try {
    let safeSource: string | null = null;
    if (rawSource && VALID_QR_SOURCES.includes(rawSource as ValidQrSource)) {
      safeSource = rawSource;
    }

    await trackAnalyticsEvent({
      eventType: 'GOOGLE_REVIEW_CLICK',
      source: safeSource,
    });

    return { success: true };
  } catch (error) {
    // Non-fatal: analytics failure must never block or prevent customer navigation
    console.error('Non-fatal: Failed to track Google review click event', error);
    return { success: false };
  }
}
