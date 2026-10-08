import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listFeedback, getFeedbackSummary } from '@/lib/repositories/feedback-repository';
import { AdminLayout } from '@/components/layout/admin-layout';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Rating,
  EmptyState,
  ErrorState,
  Button,
} from '@/components/ui';

export const metadata: Metadata = {
  title: 'Reviews & Customer Feedback',
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage() {
  await requireAdmin('/admin/reviews');

  let feedbackList;
  let summary;

  try {
    const [fetchedList, fetchedSummary] = await Promise.all([
      listFeedback({ limit: 50 }),
      getFeedbackSummary(),
    ]);
    feedbackList = fetchedList;
    summary = fetchedSummary;
  } catch (error) {
    console.error('Non-fatal: Failed to load reviews for admin', error);
    return (
      <AdminLayout
        title="Customer Reviews & Feedback"
        subtitle="View and manage customer feedback."
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load reviews and feedback"
            message="We encountered an issue loading customer feedback. Please try refreshing."
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Customer Reviews & Feedback"
      subtitle="View and manage customer feedback."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Navigation & Summary Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <Badge variant="primary" size="sm">
              Total: {summary.total}
            </Badge>
            <Badge variant="success" size="sm">
              Avg Rating: {summary.averageRating > 0 ? `${summary.averageRating} / 5` : 'No ratings'}
            </Badge>
            {summary.newCount > 0 && (
              <Badge variant="warning" size="sm">
                {summary.newCount} New
              </Badge>
            )}
          </div>
        </div>

        {/* Feedback List */}
        {feedbackList.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                title="No Feedback Records Yet"
                description="Private customer feedback submissions will appear here once customers share their experience."
              />
            </CardContent>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {feedbackList.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Rating value={item.rating} isReadOnly size="sm" />
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {item.rating} / 5 Stars
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Badge
                        variant={
                          item.status === 'NEW'
                            ? 'warning'
                            : item.status === 'REVIEWED'
                            ? 'primary'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {item.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="neutral" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--line-height-relaxed)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          padding: 'var(--space-3)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}

                    {item.customerContact && (
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          borderTop: '1px solid var(--color-border)',
                          paddingTop: 'var(--space-2)',
                        }}
                      >
                        <span>Customer contact provided voluntarily: </span>
                        <strong style={{ color: 'var(--color-text-primary)' }}>
                          {item.customerContact}
                        </strong>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

