import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { getOwnerDashboardAnalytics } from '@/lib/repositories/analytics-repository';
import { parseDashboardRange, type DashboardTimeRange } from '@/lib/validation/analytics-schema';
import { DashboardRangeFilter } from '@/components/admin/dashboard-range-filter';
import { KpiGrid } from '@/components/admin/kpi-grid';
import { ReviewFunnelCard } from '@/components/admin/review-funnel-card';
import { ActivityTrendChart } from '@/components/admin/activity-trend-chart';
import { FeedbackSummaryCard } from '@/components/admin/feedback-summary-card';
import { EventBreakdownCard } from '@/components/admin/event-breakdown-card';
import { RecentFeedbackList } from '@/components/admin/recent-feedback-list';
import { ErrorState } from '@/components/ui/error-state';

export const metadata: Metadata = {
  title: 'Owner Dashboard',
  robots: { index: false, follow: false },
};

interface AdminDashboardPageProps {
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

export default async function AdminOverviewPage({ searchParams }: AdminDashboardPageProps) {
  // 1. Enforce admin authentication
  await requireAdmin('/admin');

  // 2. Resolve and validate time range parameter
  const resolvedParams = await searchParams;
  const rawRange = typeof resolvedParams.range === 'string' ? resolvedParams.range : undefined;
  const range = parseDashboardRange(rawRange);

  // 3. Retrieve settings and dashboard analytics in parallel
  let settings;
  let analyticsData;

  try {
    const [settingsRes, analyticsRes] = await Promise.all([
      getShopSettings(),
      getOwnerDashboardAnalytics(range),
    ]);
    settings = settingsRes;
    analyticsData = analyticsRes;
  } catch (error) {
    console.error('Non-fatal: Failed to load owner dashboard analytics', error);
    return (
      <AdminLayout
        title="Dashboard"
        subtitle="Overview of your pharmacy performance"
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load dashboard data"
            message="We encountered an issue loading analytics for this period. Please try refreshing the page."
          />
        </div>
      </AdminLayout>
    );
  }

  const periodLabel = getRangeLabel(range);

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Overview of your pharmacy performance"
      shopName={settings?.shopName}
      logoUrl={settings?.logoUrl}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        {/* Top Controls: Time Range Selector */}
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
          <DashboardRangeFilter currentRange={range} baseUrl="/admin" />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Showing: <strong>{periodLabel}</strong>
          </span>
        </div>

        {/* 1. Primary KPI Metric Cards (6-pack) */}
        <section aria-label="Key Performance Indicators">
          <KpiGrid
            counts={analyticsData.counts}
            totalFeedback={analyticsData.feedback.total}
          />
        </section>

        {/* 2. Google Review Click Funnel */}
        <section aria-label="Google Review Conversion Funnel">
          <ReviewFunnelCard
            qrScans={analyticsData.reviewFunnel.qrScans}
            googleReviewClicks={analyticsData.reviewFunnel.googleReviewClicks}
            clickRate={analyticsData.reviewFunnel.clickRate}
          />
        </section>

        {/* 3. Daily Activity / Trend Visualization */}
        <section aria-label="Daily Engagement Activity Trend">
          <ActivityTrendChart
            points={analyticsData.dailyTrend}
            periodLabel={periodLabel}
          />
        </section>

        {/* 4. Split Grid: Feedback Ratings & Interaction Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-5)',
            width: '100%',
          }}
        >
          <FeedbackSummaryCard
            summary={analyticsData.feedback}
            periodLabel={periodLabel}
          />

          <EventBreakdownCard
            counts={analyticsData.counts}
            qrSources={analyticsData.qrSources}
            periodLabel={periodLabel}
          />
        </div>

        {/* 5. Recent Customer Feedback List (Privacy-Preserved) */}
        <section aria-label="Recent Feedback Submissions">
          <RecentFeedbackList
            items={analyticsData.recentFeedback}
            allFeedbackHref="/admin/reviews"
          />
        </section>
      </div>
    </AdminLayout>
  );
}
