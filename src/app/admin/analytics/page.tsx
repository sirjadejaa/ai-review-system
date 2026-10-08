import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  getOwnerDashboardAnalytics,
  getAnalyticsSummary,
} from '@/lib/repositories/analytics-repository';
import { parseDashboardRange, type DashboardTimeRange } from '@/lib/validation/analytics-schema';
import { DashboardRangeFilter } from '@/components/admin/dashboard-range-filter';
import { AnalyticsTabs, type AnalyticsTab } from '@/components/admin/analytics-tabs';
import { ReviewFunnelCard } from '@/components/admin/review-funnel-card';
import { ActivityTrendChart } from '@/components/admin/activity-trend-chart';
import { EventBreakdownCard } from '@/components/admin/event-breakdown-card';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'QR Scan & Conversion Analytics',
  robots: { index: false, follow: false },
};

interface AdminAnalyticsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getRangeLabel(range: DashboardTimeRange): string {
  switch (range) {
    case 'today':
      return 'Today';
    case '7d':
      return 'Last 7 Days';
    case '30d':
      return 'Last 30 Days';
    case 'all':
      return 'All Time';
    default:
      return 'Selected Period';
  }
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  // 1. Enforce admin authentication
  await requireAdmin('/admin/analytics');

  // 2. Resolve and validate time range query parameter
  const resolvedParams = await searchParams;
  const rawRange = typeof resolvedParams.range === 'string' ? resolvedParams.range : undefined;
  const range = parseDashboardRange(rawRange);
  const rawTab = typeof resolvedParams.tab === 'string' ? (resolvedParams.tab as AnalyticsTab) : 'overview';
  const currentTab: AnalyticsTab = ['overview', 'qr', 'reviews', 'calls', 'whatsapp', 'directions'].includes(rawTab)
    ? rawTab
    : 'overview';

  // 3. Fetch analytics data
  let analyticsData;
  let allTimeTotals;

  try {
    const [periodRes, allTimeRes] = await Promise.all([
      getOwnerDashboardAnalytics(range),
      getAnalyticsSummary(),
    ]);
    analyticsData = periodRes;
    allTimeTotals = allTimeRes;
  } catch (error) {
    console.error('Non-fatal: Failed to load detailed analytics', error);
    return (
      <AdminLayout
        title="Analytics"
        subtitle="Track customer engagement and growth."
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load analytics data"
            message="We encountered an issue loading analytics. Please try refreshing."
          />
        </div>
      </AdminLayout>
    );
  }

  const periodLabel = getRangeLabel(range);

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Track customer engagement and growth."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        {/* Time Range Selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
            paddingBottom: 'var(--space-2)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <DashboardRangeFilter currentRange={range} baseUrl="/admin/analytics" />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Filter: <strong>{periodLabel}</strong>
          </span>
        </div>

        {/* Section Tabs (Screen 10 specification: Overview, QR Scans, Review Clicks, Call Clicks, WhatsApp Clicks, Directions) */}
        <AnalyticsTabs currentTab={currentTab} currentRange={range} />

        {/* All-Time vs Selected Period Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <Card variant="compact">
            <CardHeader>
              <CardDescription>Period QR Scans</CardDescription>
              <CardTitle as="div" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-info)' }}>
                {analyticsData.counts.qrScans.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                All-time: {allTimeTotals.totalScans.toLocaleString()} scans
              </span>
            </CardContent>
          </Card>

          <Card variant="compact">
            <CardHeader>
              <CardDescription>Period Google Clicks</CardDescription>
              <CardTitle as="div" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary)' }}>
                {analyticsData.counts.googleReviewClicks.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                All-time: {allTimeTotals.googleReviewClicks.toLocaleString()} clicks
              </span>
            </CardContent>
          </Card>

          <Card variant="compact">
            <CardHeader>
              <CardDescription>Period Contact Actions</CardDescription>
              <CardTitle as="div" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-success)' }}>
                {(
                  analyticsData.counts.callClicks +
                  analyticsData.counts.whatsappClicks +
                  analyticsData.counts.directionsClicks
                ).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                All-time: {(
                  allTimeTotals.callClicks +
                  allTimeTotals.whatsappClicks +
                  allTimeTotals.directionsClicks
                ).toLocaleString()} actions
              </span>
            </CardContent>
          </Card>

          <Card variant="compact">
            <CardHeader>
              <CardDescription>Review Click-Through</CardDescription>
              <CardTitle as="div" style={{ fontSize: 'var(--font-size-2xl)' }}>
                {analyticsData.reviewFunnel.clickRate !== null
                  ? `${analyticsData.reviewFunnel.clickRate}%`
                  : '—'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Handoff rate for {periodLabel.toLowerCase()}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Funnel Section */}
        <section aria-label="Review Conversion Funnel">
          <ReviewFunnelCard
            qrScans={analyticsData.reviewFunnel.qrScans}
            googleReviewClicks={analyticsData.reviewFunnel.googleReviewClicks}
            clickRate={analyticsData.reviewFunnel.clickRate}
          />
        </section>

        {/* Activity Trend */}
        <section aria-label="Activity Trend">
          <ActivityTrendChart
            points={analyticsData.dailyTrend}
            periodLabel={periodLabel}
          />
        </section>

        {/* Event Breakdown */}
        <section aria-label="Event Breakdown">
          <EventBreakdownCard
            counts={analyticsData.counts}
            qrSources={analyticsData.qrSources}
            periodLabel={periodLabel}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
