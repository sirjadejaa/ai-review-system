import { z } from 'zod';

export const AnalyticsEventTypeSchema = z.enum([
  'QR_SCAN',
  'GOOGLE_REVIEW_CLICK',
  'CALL_CLICK',
  'WHATSAPP_CLICK',
  'DIRECTIONS_CLICK',
]);

export const TrackAnalyticsEventSchema = z.object({
  eventType: AnalyticsEventTypeSchema,
  source: z.string().trim().max(50).nullable().optional(),
});

export type TrackAnalyticsEventInput = z.infer<typeof TrackAnalyticsEventSchema>;

export const DashboardRangeSchema = z.enum(['today', '7d', '30d', 'all']);
export type DashboardTimeRange = z.infer<typeof DashboardRangeSchema>;

/**
 * Safely parses and whitelists dashboard time range query parameters.
 * Rejects invalid strings and defaults safely to '30d'.
 */
export function parseDashboardRange(raw?: string | null): DashboardTimeRange {
  if (!raw) return '30d';
  const parsed = DashboardRangeSchema.safeParse(raw.toLowerCase().trim());
  return parsed.success ? parsed.data : '30d';
}

/**
 * Calculates the start date filter corresponding to the chosen time range.
 */
export function getStartDateForRange(range: DashboardTimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}
