import { prisma } from '@/lib/db';
import type { DomainAnalyticsEvent, AnalyticsEventType } from '@/lib/domain/types';
import {
  TrackAnalyticsEventSchema,
  type TrackAnalyticsEventInput,
  type DashboardTimeRange,
  getStartDateForRange,
} from '@/lib/validation/analytics-schema';
import {
  getFeedbackDashboardAnalytics,
  type FeedbackDashboardSummary,
  type DashboardRecentFeedbackItem,
} from './feedback-repository';

function toDomain(record: {
  id: string;
  eventType: string;
  source: string | null;
  createdAt: Date;
}): DomainAnalyticsEvent {
  return {
    id: record.id,
    eventType: record.eventType as AnalyticsEventType,
    source: record.source,
    createdAt: record.createdAt,
  };
}

/**
 * Tracks a customer analytics interaction in a privacy-conscious manner.
 * Tracks "GOOGLE_REVIEW_CLICK", NEVER confirmed reviews.
 * Does NOT collect GPS, MAC addresses, device fingerprints, or invasive tracking data.
 */
export async function trackAnalyticsEvent(
  input: TrackAnalyticsEventInput
): Promise<DomainAnalyticsEvent> {
  const validated = TrackAnalyticsEventSchema.parse(input);

  const created = await prisma.analyticsEvent.create({
    data: {
      eventType: validated.eventType,
      source: validated.source ?? null,
    },
  });

  return toDomain(created);
}

/**
 * Lists analytics events with optional type filtering.
 */
export async function listAnalyticsEvents(options?: {
  eventType?: AnalyticsEventType;
  limit?: number;
  offset?: number;
}): Promise<DomainAnalyticsEvent[]> {
  const records = await prisma.analyticsEvent.findMany({
    where: options?.eventType ? { eventType: options.eventType } : undefined,
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
  });

  return records.map(toDomain);
}

/**
 * Aggregates core conversion and scan counts for the owner dashboard.
 */
export async function getAnalyticsSummary(): Promise<{
  totalScans: number;
  googleReviewClicks: number;
  callClicks: number;
  whatsappClicks: number;
  directionsClicks: number;
}> {
  const counts = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    _count: { id: true },
  });

  const summary = {
    totalScans: 0,
    googleReviewClicks: 0,
    callClicks: 0,
    whatsappClicks: 0,
    directionsClicks: 0,
  };

  for (const item of counts) {
    if (item.eventType === 'QR_SCAN') summary.totalScans = item._count.id;
    if (item.eventType === 'GOOGLE_REVIEW_CLICK') summary.googleReviewClicks = item._count.id;
    if (item.eventType === 'CALL_CLICK') summary.callClicks = item._count.id;
    if (item.eventType === 'WHATSAPP_CLICK') summary.whatsappClicks = item._count.id;
    if (item.eventType === 'DIRECTIONS_CLICK') summary.directionsClicks = item._count.id;
  }

  return summary;
}

export interface EventCountsSummary {
  qrScans: number;
  googleReviewClicks: number;
  callClicks: number;
  whatsappClicks: number;
  directionsClicks: number;
  totalEngagements: number;
}

export interface DayActivityPoint {
  dateKey: string;
  label: string;
  qrScans: number;
  googleReviewClicks: number;
  contactClicks: number;
  total: number;
}

export interface QRSourceBreakdownItem {
  source: string;
  count: number;
  percentage: number;
}

export interface OwnerDashboardData {
  range: DashboardTimeRange;
  startDate: Date | null;
  counts: EventCountsSummary;
  reviewFunnel: {
    qrScans: number;
    googleReviewClicks: number;
    clickRate: number | null;
  };
  dailyTrend: DayActivityPoint[];
  qrSources: QRSourceBreakdownItem[];
  feedback: FeedbackDashboardSummary;
  recentFeedback: DashboardRecentFeedbackItem[];
}

/**
 * Aggregates event counts within the specified date range.
 */
export async function getAnalyticsCountsForRange(
  startDate: Date | null
): Promise<EventCountsSummary> {
  const whereClause = startDate ? { createdAt: { gte: startDate } } : undefined;

  const counts = await prisma.analyticsEvent.groupBy({
    by: ['eventType'],
    where: whereClause,
    _count: { id: true },
  });

  const summary: EventCountsSummary = {
    qrScans: 0,
    googleReviewClicks: 0,
    callClicks: 0,
    whatsappClicks: 0,
    directionsClicks: 0,
    totalEngagements: 0,
  };

  for (const item of counts) {
    const c = item._count.id;
    if (item.eventType === 'QR_SCAN') summary.qrScans = c;
    else if (item.eventType === 'GOOGLE_REVIEW_CLICK') summary.googleReviewClicks = c;
    else if (item.eventType === 'CALL_CLICK') summary.callClicks = c;
    else if (item.eventType === 'WHATSAPP_CLICK') summary.whatsappClicks = c;
    else if (item.eventType === 'DIRECTIONS_CLICK') summary.directionsClicks = c;
  }

  summary.totalEngagements =
    summary.qrScans +
    summary.googleReviewClicks +
    summary.callClicks +
    summary.whatsappClicks +
    summary.directionsClicks;

  return summary;
}

/**
 * Calculates QR scan source distribution (qr, counter, table, card, direct).
 */
export async function getQRSourceBreakdown(
  startDate: Date | null
): Promise<QRSourceBreakdownItem[]> {
  const whereClause = {
    eventType: 'QR_SCAN',
    ...(startDate ? { createdAt: { gte: startDate } } : {}),
  };

  const grouped = await prisma.analyticsEvent.groupBy({
    by: ['source'],
    where: whereClause,
    _count: { id: true },
  });

  const totalScans = grouped.reduce((sum, item) => sum + item._count.id, 0);

  return grouped
    .map((item) => {
      const sourceName = item.source ? item.source.toLowerCase() : 'direct/other';
      const count = item._count.id;
      const percentage = totalScans > 0 ? Number(((count / totalScans) * 100).toFixed(1)) : 0;
      return {
        source: sourceName,
        count,
        percentage,
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Builds responsive daily activity trend points across the selected range.
 * Guaranteed to produce continuous timeline points even when activity is zero.
 */
export async function getDailyActivityTrend(
  range: DashboardTimeRange | number
): Promise<DayActivityPoint[]> {
  const now = new Date();
  const numDays =
    typeof range === 'number'
      ? range
      : range === 'today'
      ? 1
      : range === '7d'
      ? 7
      : 30;

  const days: DayActivityPoint[] = [];
  const dateMap = new Map<string, DayActivityPoint>();

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const point: DayActivityPoint = {
      dateKey,
      label,
      qrScans: 0,
      googleReviewClicks: 0,
      contactClicks: 0,
      total: 0,
    };
    days.push(point);
    dateMap.set(dateKey, point);
  }

  const oldestDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (numDays - 1),
    0,
    0,
    0,
    0
  );

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: oldestDate },
    },
    select: {
      eventType: true,
      createdAt: true,
    },
  });

  for (const ev of events) {
    const evDate = new Date(ev.createdAt);
    const key = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}-${String(evDate.getDate()).padStart(2, '0')}`;
    const point = dateMap.get(key);
    if (point) {
      if (ev.eventType === 'QR_SCAN') point.qrScans += 1;
      else if (ev.eventType === 'GOOGLE_REVIEW_CLICK') point.googleReviewClicks += 1;
      else if (
        ev.eventType === 'CALL_CLICK' ||
        ev.eventType === 'WHATSAPP_CLICK' ||
        ev.eventType === 'DIRECTIONS_CLICK'
      ) {
        point.contactClicks += 1;
      }
      point.total += 1;
    }
  }

  return days;
}

/**
 * Main server-side aggregation method for the Owner Dashboard.
 */
export async function getOwnerDashboardAnalytics(
  range: DashboardTimeRange
): Promise<OwnerDashboardData> {
  const startDate = getStartDateForRange(range);

  const [counts, qrSources, dailyTrend, feedbackData] = await Promise.all([
    getAnalyticsCountsForRange(startDate),
    getQRSourceBreakdown(startDate),
    getDailyActivityTrend(range),
    getFeedbackDashboardAnalytics(startDate),
  ]);

  const clickRate =
    counts.qrScans > 0
      ? Number(((counts.googleReviewClicks / counts.qrScans) * 100).toFixed(1))
      : null;

  return {
    range,
    startDate,
    counts,
    reviewFunnel: {
      qrScans: counts.qrScans,
      googleReviewClicks: counts.googleReviewClicks,
      clickRate,
    },
    dailyTrend,
    qrSources,
    feedback: feedbackData.summary,
    recentFeedback: feedbackData.recent,
  };
}
