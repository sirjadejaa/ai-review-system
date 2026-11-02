import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import {
  getGoogleConnectionStatus,
  getGoogleReviewStats,
  listGoogleReviews,
} from '@/lib/repositories/google-review-repository';
import { GoogleReviewsManager } from '@/components/admin/google-reviews-manager';
import { ErrorState } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Google Reviews & AI Replies | Boutique Admin',
  robots: { index: false, follow: false },
};

interface AdminGoogleReviewsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminGoogleReviewsPage({
  searchParams,
}: AdminGoogleReviewsPageProps) {
  await requireAdmin('/admin/google-reviews');

  const resolved = await searchParams;
  const rawStatus = typeof resolved.status === 'string' ? resolved.status.toUpperCase() : 'ALL';
  const rawRating = typeof resolved.rating === 'string' ? resolved.rating.toUpperCase() : 'ALL';
  const searchQuery = typeof resolved.q === 'string' ? resolved.q : '';
  const pageNum = typeof resolved.page === 'string' ? parseInt(resolved.page, 10) || 1 : 1;

  const validStatus = (['ALL', 'REPLIED', 'UNREPLIED'].includes(rawStatus) ? rawStatus : 'ALL') as
    | 'ALL'
    | 'REPLIED'
    | 'UNREPLIED';

  const validRating = (['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(rawRating) ? rawRating : 'ALL') as
    | 'ALL'
    | 'POSITIVE'
    | 'NEUTRAL'
    | 'NEGATIVE';

  try {
    const [settings, connection, stats, reviewsData] = await Promise.all([
      getShopSettings(),
      getGoogleConnectionStatus(),
      getGoogleReviewStats(),
      listGoogleReviews({
        replyStatus: validStatus,
        ratingFilter: validRating,
        searchQuery,
        page: pageNum,
        pageSize: 12,
      }),
    ]);

    return (
      <AdminLayout
        title="Google Reviews"
        subtitle="Synchronize Google Business Profile reviews, generate personalized AI replies, and publish owner responses."
        shopName={settings?.shopName}
        logoUrl={settings?.logoUrl}
      >
        <GoogleReviewsManager
          connection={connection}
          stats={stats}
          initialReviews={reviewsData.reviews}
          totalCount={reviewsData.totalCount}
          currentPage={reviewsData.currentPage}
          totalPages={reviewsData.totalPages}
          initialFilters={{
            status: validStatus,
            rating: validRating,
            searchQuery,
          }}
          shopName={settings?.shopName || 'Maison & Thread'}
        />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Non-fatal: Failed to load Google reviews for admin', error);
    return (
      <AdminLayout
        title="Google Reviews"
        subtitle="Synchronize Google Business Profile reviews, generate personalized AI replies, and publish owner responses."
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load Google reviews"
            message="We encountered an issue loading your Google Business reviews. Please refresh or check connection."
          />
        </div>
      </AdminLayout>
    );
  }
}
