'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { GoogleConnectionStatus, GoogleReviewStats } from '@/lib/google/types';
import {
  syncGoogleReviewsAction,
  generateAIReplyAction,
  saveReplyDraftAction,
  publishReplyAction,
  disconnectGoogleAction,
} from '@/lib/actions/google-review-actions';
import {
  Button,
  Badge,
  Input,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Star,
  RefreshCw,
  Sparkles,
  Send,
  Copy,
  Check,
  ExternalLink,
  Search,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Unlink,
  MessageSquare,
} from 'lucide-react';
import styles from './google-reviews-manager.module.css';

interface GoogleReviewWithDrafts {
  id: string;
  googleReviewId: string;
  reviewerName: string;
  reviewerPhotoUrl?: string | null;
  starRating: number;
  comment?: string | null;
  reviewCreatedAt: Date | string;
  reviewUpdatedAt?: Date | string | null;
  replyText?: string | null;
  replyUpdatedAt?: Date | string | null;
  replyStatus: string;
  drafts?: {
    id: string;
    draftText: string;
    language: string;
    isApproved: boolean;
    isPublished: boolean;
    createdAt: Date | string;
  }[];
}

interface GoogleReviewsManagerProps {
  connection: GoogleConnectionStatus;
  stats: GoogleReviewStats;
  initialReviews: GoogleReviewWithDrafts[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  initialFilters: {
    status: 'ALL' | 'REPLIED' | 'UNREPLIED';
    rating: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    searchQuery: string;
  };
  shopName: string;
}

export const GoogleReviewsManager: React.FC<GoogleReviewsManagerProps> = ({
  connection,
  stats,
  initialReviews,
  totalCount,
  currentPage,
  totalPages,
  initialFilters,
  shopName,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [reviews, setReviews] = useState<GoogleReviewWithDrafts[]>(initialReviews);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Filters State
  const [statusFilter, setStatusFilter] = useState(initialFilters.status);
  const [ratingFilter, setRatingFilter] = useState(initialFilters.rating);
  const [searchInput, setSearchInput] = useState(initialFilters.searchQuery);

  // Active Reply Modal State
  const [activeReview, setActiveReview] = useState<GoogleReviewWithDrafts | null>(null);
  const [replyLanguage, setReplyLanguage] = useState<'en' | 'gujlish' | 'hinglish'>('en');
  const [replyText, setReplyText] = useState('');
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [isCopied, setIsCopied] = useState(false);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(!connection.isConfigured);

  // Toast Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  // Trigger Filter Navigation
  const applyFilters = (newStatus = statusFilter, newRating = ratingFilter, newSearch = searchInput) => {
    const params = new URLSearchParams();
    if (newStatus !== 'ALL') params.set('status', newStatus);
    if (newRating !== 'ALL') params.set('rating', newRating);
    if (newSearch.trim()) params.set('q', newSearch.trim());
    params.set('page', '1');

    router.push(`/admin/google-reviews?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (ratingFilter !== 'ALL') params.set('rating', ratingFilter);
    if (searchInput.trim()) params.set('q', searchInput.trim());
    params.set('page', String(newPage));

    router.push(`/admin/google-reviews?${params.toString()}`);
  };

  // Manual Sync Action
  const handleManualSync = async () => {
    if (!connection.isConnected) {
      if (!connection.isConfigured) {
        setShowSetupModal(true);
      } else {
        window.location.href = '/api/auth/google';
      }
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncGoogleReviewsAction();
      if (res.success) {
        showNotification('success', res.message);
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message);
      }
    } catch {
      showNotification('error', 'Synchronization request failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Reply Modal for a Review
  const handleOpenReplyModal = async (review: GoogleReviewWithDrafts) => {
    setActiveReview(review);
    setIsCopied(false);

    // If review already has a published reply, prefill it for editing
    if (review.replyText) {
      setReplyText(review.replyText);
      setActiveDraftId(undefined);
      return;
    }

    // If review already has an existing saved draft, prefill it
    if (review.drafts && review.drafts.length > 0) {
      const latest = review.drafts[0];
      setReplyText(latest.draftText);
      setReplyLanguage((latest.language as 'en' | 'gujlish' | 'hinglish') || 'en');
      setActiveDraftId(latest.id);
      return;
    }

    // Auto-generate AI draft on open
    setIsGenerating(true);
    try {
      const res = await generateAIReplyAction({
        reviewId: review.id,
        language: replyLanguage,
      });
      if (res.success && res.draftText) {
        setReplyText(res.draftText);
        setActiveDraftId(res.draftId);
      } else {
        setReplyText('');
      }
    } catch {
      setReplyText('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate Draft with Selected Language
  const handleRegenerateDraft = async (lang: 'en' | 'gujlish' | 'hinglish') => {
    if (!activeReview) return;
    setReplyLanguage(lang);
    setIsGenerating(true);
    try {
      const res = await generateAIReplyAction({
        reviewId: activeReview.id,
        language: lang,
      });
      if (res.success && res.draftText) {
        setReplyText(res.draftText);
        setActiveDraftId(res.draftId);
        showNotification('success', 'New draft generated.');
      } else {
        showNotification('error', res.message);
      }
    } catch {
      showNotification('error', 'Draft regeneration failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Draft to DB
  const handleSaveDraft = async () => {
    if (!activeReview || !replyText.trim()) return;
    setIsSavingDraft(true);
    try {
      const res = await saveReplyDraftAction({
        reviewId: activeReview.id,
        draftText: replyText.trim(),
        language: replyLanguage,
      });
      if (res.success) {
        setActiveDraftId(res.draftId);
        showNotification('success', 'Reply draft saved.');
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message);
      }
    } catch {
      showNotification('error', 'Failed to save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Copy Draft
  const handleCopyDraft = async () => {
    if (!replyText) return;
    try {
      await navigator.clipboard.writeText(replyText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      showNotification('error', 'Clipboard copy failed.');
    }
  };

  // Publish Reply to Google
  const handleConfirmPublish = async () => {
    if (!activeReview || !replyText.trim()) return;
    setIsPublishing(true);
    try {
      const res = await publishReplyAction({
        reviewId: activeReview.id,
        replyText: replyText.trim(),
        draftId: activeDraftId,
      });

      if (res.success) {
        showNotification('success', res.message);
        setShowConfirmPublish(false);
        setActiveReview(null);
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message);
        setShowConfirmPublish(false);
      }
    } catch {
      showNotification('error', 'Publication request failed.');
      setShowConfirmPublish(false);
    } finally {
      setIsPublishing(false);
    }
  };

  // Disconnect Google Account
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Business Profile account?')) {
      return;
    }
    try {
      const res = await disconnectGoogleAction();
      if (res.success) {
        showNotification('success', res.message);
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message);
      }
    } catch {
      showNotification('error', 'Disconnect failed.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              notification.type === 'success' ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
            color:
              notification.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            border: `1px solid ${
              notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
            }`,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          {notification.text}
        </div>
      )}

      {/* 1. Google Business Profile Connection Banner */}
      <section
        className={`${styles.connectionBanner} ${
          connection.isConnected ? styles.connected : styles.disconnected
        }`}
        aria-label="Google Business Profile Status"
      >
        <div className={styles.bannerInfo}>
          {connection.isConnected ? (
            <CheckCircle size={28} style={{ color: 'var(--color-success)' }} />
          ) : (
            <AlertCircle size={28} style={{ color: 'var(--color-warning)' }} />
          )}

          <div className={styles.bannerText}>
            <div className={styles.bannerTitle}>
              {connection.isConnected
                ? `Connected to: ${connection.locationName || connection.accountName || 'Google Business Profile'}`
                : connection.isConfigured
                ? 'Google Business Profile Not Connected'
                : 'Google OAuth Setup Required'}
            </div>
            <div className={styles.bannerSubtitle}>
              {connection.isConnected ? (
                <>
                  Last synchronized:{' '}
                  {connection.lastSyncAt
                    ? new Date(connection.lastSyncAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Never'}
                  {connection.lastSyncError && (
                    <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>
                      • Warning: {connection.lastSyncError}
                    </span>
                  )}
                </>
              ) : connection.isConfigured ? (
                'Connect your Google account to automatically import reviews and publish owner replies.'
              ) : (
                'Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment to enable integration.'
              )}
            </div>
          </div>
        </div>

        <div className={styles.bannerActions}>
          {connection.isConnected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                isLoading={isSyncing}
                title="Synchronize latest reviews from Google API"
              >
                <RefreshCw size={14} style={{ marginRight: 4 }} />
                <span>Sync Reviews</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                title="Disconnect Google Profile"
                style={{ color: 'var(--color-danger)' }}
              >
                <Unlink size={14} style={{ marginRight: 4 }} />
                <span>Disconnect</span>
              </Button>
            </>
          ) : connection.isConfigured ? (
            <a href="/api/auth/google" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                <ExternalLink size={14} style={{ marginRight: 4 }} />
                <span>Connect Google Account</span>
              </Button>
            </a>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowSetupModal(true)}>
              <HelpCircle size={14} style={{ marginRight: 4 }} />
              <span>View Setup Checklist</span>
            </Button>
          )}
        </div>
      </section>

      {/* 2. Real Database Statistics Bar */}
      <section className={styles.statsGrid} aria-label="Review Statistics">
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalSynced}</div>
          <div className={styles.statLabel}>Total Synced Reviews</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--color-success)' }}>
            {stats.repliedCount}
          </div>
          <div className={styles.statLabel}>Replied Reviews</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--color-warning)' }}>
            {stats.unrepliedCount}
          </div>
          <div className={styles.statLabel}>Unreplied Reviews</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#d49b44' }}>
            ★ {stats.averageRating > 0 ? stats.averageRating : '0.0'}
          </div>
          <div className={styles.statLabel}>Average Rating</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.replyCoveragePercentage}%</div>
          <div className={styles.statLabel}>Reply Coverage</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.publishedReplies}</div>
          <div className={styles.statLabel}>Published Replies</div>
        </div>
      </section>

      {/* 3. Filters & Search Controls */}
      <section className={styles.controlsBar} aria-label="Review Filters">
        <div className={styles.filterGroup}>
          {/* Status Filter */}
          <select
            className={styles.selectInput}
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value as 'ALL' | 'REPLIED' | 'UNREPLIED';
              setStatusFilter(val);
              applyFilters(val, ratingFilter, searchInput);
            }}
            aria-label="Filter by reply status"
          >
            <option value="ALL">All Statuses ({stats.totalSynced})</option>
            <option value="UNREPLIED">Unreplied ({stats.unrepliedCount})</option>
            <option value="REPLIED">Replied ({stats.repliedCount})</option>
          </select>

          {/* Sentiment Filter */}
          <select
            className={styles.selectInput}
            value={ratingFilter}
            onChange={(e) => {
              const val = e.target.value as 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
              setRatingFilter(val);
              applyFilters(statusFilter, val, searchInput);
            }}
            aria-label="Filter by rating sentiment"
          >
            <option value="ALL">All Ratings</option>
            <option value="POSITIVE">Positive (4–5 Stars)</option>
            <option value="NEUTRAL">Neutral (3 Stars)</option>
            <option value="NEGATIVE">Negative (1–2 Stars)</option>
          </select>
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(statusFilter, ratingFilter, searchInput);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--color-text-tertiary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search reviewer or comment..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '30px' }}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </section>

      {/* 4. Reviews List */}
      {reviews.length === 0 ? (
        <EmptyState
          title="No Google Reviews Found"
          description={
            connection.isConnected
              ? 'No reviews match your selected filters. Try adjusting your status or search terms, or click "Sync Reviews" above.'
              : 'Connect your store\'s Google Business Profile above to synchronize reviews and start generating AI replies.'
          }
          action={
            connection.isConnected ? (
              <Button variant="primary" size="md" onClick={handleManualSync} isLoading={isSyncing}>
                <RefreshCw size={15} style={{ marginRight: 6 }} />
                <span>Sync Reviews Now</span>
              </Button>
            ) : connection.isConfigured ? (
              <a href="/api/auth/google" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="md">
                  <ExternalLink size={15} style={{ marginRight: 6 }} />
                  <span>Connect Google Account</span>
                </Button>
              </a>
            ) : (
              <Button variant="primary" size="md" onClick={() => setShowSetupModal(true)}>
                <HelpCircle size={15} style={{ marginRight: 6 }} />
                <span>View Google Setup Guide</span>
              </Button>
            )
          }
        />
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((rev) => {
            const hasReply = Boolean(rev.replyText && rev.replyText.trim());
            const hasDraft = !hasReply && rev.drafts && rev.drafts.length > 0;
            const reviewerInitials = rev.reviewerName
              ? rev.reviewerName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'G';

            return (
              <article key={rev.id} className={styles.reviewCard}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.reviewerProfile}>
                    {rev.reviewerPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rev.reviewerPhotoUrl}
                        alt={rev.reviewerName}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatar}>{reviewerInitials}</div>
                    )}

                    <div className={styles.reviewerMeta}>
                      <h3 className={styles.reviewerName}>{rev.reviewerName}</h3>
                      <span className={styles.reviewDate}>
                        {new Date(rev.reviewCreatedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {/* Star Rating */}
                    <div className={styles.starRatingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          fill={star <= rev.starRating ? '#d49b44' : 'none'}
                          stroke={star <= rev.starRating ? '#d49b44' : 'var(--color-border)'}
                        />
                      ))}
                    </div>

                    {/* Reply Status Badge */}
                    {hasReply ? (
                      <Badge variant="success">Replied</Badge>
                    ) : hasDraft ? (
                      <Badge variant="warning">Draft Ready</Badge>
                    ) : (
                      <Badge variant="neutral">Unreplied</Badge>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                {rev.comment ? (
                  <p className={styles.reviewComment}>{rev.comment}</p>
                ) : (
                  <p className={styles.noCommentText}>No written review (rating only).</p>
                )}

                {/* Published Owner Reply or Active Draft */}
                {hasReply && (
                  <div className={styles.ownerReplyBox}>
                    <div className={styles.ownerReplyHeader}>
                      <span>Store Owner Response (Published on Google)</span>
                      {rev.replyUpdatedAt && (
                        <span>
                          {new Date(rev.replyUpdatedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className={styles.ownerReplyText}>{rev.replyText}</p>
                  </div>
                )}

                {hasDraft && !hasReply && (
                  <div
                    className={styles.ownerReplyBox}
                    style={{ borderLeftColor: 'var(--color-warning)' }}
                  >
                    <div className={styles.ownerReplyHeader} style={{ color: 'var(--color-warning)' }}>
                      <span>Saved Reply Draft ({rev.drafts![0].language.toUpperCase()})</span>
                      <span>Not yet published to Google</span>
                    </div>
                    <p className={styles.ownerReplyText}>{rev.drafts![0].draftText}</p>
                  </div>
                )}

                {/* Card Action Footer */}
                <div className={styles.cardFooter}>
                  {hasReply ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReplyModal(rev)}
                    >
                      <span>Edit Published Reply</span>
                    </Button>
                  ) : hasDraft ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenReplyModal(rev)}
                    >
                      <Sparkles size={14} style={{ marginRight: 4 }} />
                      <span>Review &amp; Publish Draft</span>
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenReplyModal(rev)}
                    >
                      <Sparkles size={14} style={{ marginRight: 4 }} />
                      <span>Generate AI Reply</span>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Bar */}
      {totalPages > 1 && (
        <div className={styles.paginationBar}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>

          <span className={styles.pageIndicator}>
            Page {currentPage} of {totalPages} ({totalCount} total reviews)
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* 6. AI Reply Editor & Approval Modal */}
      <Modal
        isOpen={activeReview !== null}
        onClose={() => {
          if (!isPublishing) setActiveReview(null);
        }}
        title="Owner Review Response"
      >
        {activeReview && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Review Snapshot */}
            <div className={styles.modalReviewContext}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                  {activeReview.reviewerName}
                </strong>
                <div className={styles.starRatingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      fill={star <= activeReview.starRating ? '#d49b44' : 'none'}
                      stroke={star <= activeReview.starRating ? '#d49b44' : 'var(--color-border)'}
                    />
                  ))}
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  fontStyle: activeReview.comment ? 'normal' : 'italic',
                }}
              >
                {activeReview.comment || 'No written text (rating only).'}
              </p>
            </div>

            {/* Language Selection & Regenerate Bar */}
            <div className={styles.languageBar}>
              <label className={styles.modalSectionLabel} style={{ margin: 0 }}>
                Reply Language
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <select
                  className={styles.selectInput}
                  value={replyLanguage}
                  onChange={(e) => {
                    const l = e.target.value as 'en' | 'gujlish' | 'hinglish';
                    setReplyLanguage(l);
                    handleRegenerateDraft(l);
                  }}
                  disabled={isGenerating || isPublishing}
                  aria-label="Select reply language"
                >
                  <option value="en">English</option>
                  <option value="gujlish">ગુજરાતી + English (Gujlish)</option>
                  <option value="hinglish">हिंदी + English (Hinglish)</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRegenerateDraft(replyLanguage)}
                  isLoading={isGenerating}
                  disabled={isPublishing}
                  title="Regenerate reply with AI"
                >
                  <Sparkles size={14} style={{ marginRight: 4 }} />
                  <span>Regenerate</span>
                </Button>
              </div>
            </div>

            {/* Editable Reply Textarea */}
            <div>
              <textarea
                className={styles.replyTextarea}
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write or edit store owner response..."
                disabled={isGenerating || isPublishing}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-tertiary)',
                  marginTop: 2,
                }}
              >
                {replyText.length} characters • Never published without your approval
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className={styles.modalFooter}>
              <div className={styles.secondaryActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDraft}
                  disabled={!replyText || isPublishing}
                >
                  {isCopied ? (
                    <>
                      <Check size={14} style={{ color: 'var(--color-success)', marginRight: 4 }} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} style={{ marginRight: 4 }} />
                      <span>Copy</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveDraft}
                  isLoading={isSavingDraft}
                  disabled={!replyText.trim() || isPublishing}
                >
                  <span>Save as Draft</span>
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveReview(null)}
                  disabled={isPublishing}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowConfirmPublish(true)}
                  disabled={!replyText.trim() || isPublishing}
                >
                  <Send size={14} style={{ marginRight: 4 }} />
                  <span>Publish Reply</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Publish Confirmation Dialog */}
      <Modal
        isOpen={showConfirmPublish}
        onClose={() => {
          if (!isPublishing) setShowConfirmPublish(false);
        }}
        title="Confirm Publishing to Google"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            You are about to publish this official owner response to Google Business Profile for{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {activeReview?.reviewerName}
            </strong>
            . This reply will be publicly visible to anyone searching for {shopName} on Google Maps and Google Search.
          </p>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-bg-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--line-height-relaxed)',
            }}
          >
            &quot;{replyText}&quot;
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              variant="outline"
              onClick={() => setShowConfirmPublish(false)}
              disabled={isPublishing}
            >
              Back to Edit
            </Button>

            <Button
              variant="primary"
              onClick={handleConfirmPublish}
              isLoading={isPublishing}
            >
              Confirm &amp; Publish to Google
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. Google API Setup Checklist Modal */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Google Business Profile Setup Guide"
      >
        <div className={styles.setupCard}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            To connect your clothing boutique&apos;s Google Business Profile and synchronize live reviews,
            follow these official Google Cloud setup steps:
          </p>

          <div className={styles.checklistStep}>
            <div className={styles.stepNumber}>1</div>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Create Google Cloud Project</strong>
              <div>Visit the Google Cloud Console and create or select your project.</div>
            </div>
          </div>

          <div className={styles.checklistStep}>
            <div className={styles.stepNumber}>2</div>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Enable Required APIs</strong>
              <div>
                Enable <code>Google My Business API</code>, <code>My Business Account Management API</code>, and{' '}
                <code>My Business Business Information API</code>.
              </div>
            </div>
          </div>

          <div className={styles.checklistStep}>
            <div className={styles.stepNumber}>3</div>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Configure OAuth 2.0 Credentials</strong>
              <div>
                Create OAuth 2.0 Web Application credentials. Add Authorized Redirect URI:
                <br />
                <code
                  style={{
                    display: 'inline-block',
                    padding: '3px 6px',
                    marginTop: '4px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                  }}
                >
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/api/auth/google/callback`
                    : 'http://localhost:3000/api/auth/google/callback'}
                </code>
              </div>
            </div>
          </div>

          <div className={styles.checklistStep}>
            <div className={styles.stepNumber}>4</div>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Set Environment Variables</strong>
              <div>
                Add the following keys to your <code>.env</code> file:
                <pre
                  style={{
                    padding: '8px 12px',
                    marginTop: '6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                  }}
                >
                  {`GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"\nGOOGLE_CLIENT_SECRET="your-client-secret"`}
                </pre>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <Button variant="primary" onClick={() => setShowSetupModal(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
