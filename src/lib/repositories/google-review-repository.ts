import { prisma } from '@/lib/db';
import { encryptToken, decryptToken } from '@/lib/security/encryption';
import {
  isGoogleOAuthConfigured,
  refreshAccessToken,
  fetchGoogleReviews,
} from '@/lib/google/client';
import type {
  GoogleConnectionStatus,
  GoogleReviewStats,
  GoogleReviewItemFromApi,
} from '@/lib/google/types';

export const CONNECTION_SINGLETON_ID = 'default_connection';

function mapStarRatingToNumber(starString: string): number {
  switch (starString) {
    case 'FIVE':
      return 5;
    case 'FOUR':
      return 4;
    case 'THREE':
      return 3;
    case 'TWO':
      return 2;
    case 'ONE':
    default:
      return 1;
  }
}

/**
 * Retrieves the current Google Business connection status.
 * Never leaks encrypted or decrypted access tokens.
 */
export async function getGoogleConnectionStatus(): Promise<GoogleConnectionStatus> {
  const isConfigured = isGoogleOAuthConfigured();
  const conn = await prisma.googleBusinessAccount.findUnique({
    where: { id: CONNECTION_SINGLETON_ID },
  });

  if (!conn || !conn.isConnected) {
    return {
      isConfigured,
      isConnected: false,
      accountName: null,
      locationName: null,
      locationId: null,
      lastSyncAt: conn?.lastSyncAt || null,
      lastSyncError: conn?.lastSyncError || null,
    };
  }

  return {
    isConfigured,
    isConnected: true,
    accountName: conn.accountName,
    locationName: conn.locationName,
    locationId: conn.locationId,
    lastSyncAt: conn.lastSyncAt,
    lastSyncError: conn.lastSyncError,
  };
}

/**
 * Internal helper to obtain a valid access token.
 * Refreshes token if expired or close to expiry (<60s remaining).
 */
export async function getValidAccessToken(): Promise<{
  accessToken: string;
  locationId: string;
} | null> {
  const conn = await prisma.googleBusinessAccount.findUnique({
    where: { id: CONNECTION_SINGLETON_ID },
  });

  if (!conn || !conn.isConnected || !conn.locationId) {
    return null;
  }

  const decryptedAccess = decryptToken(conn.accessTokenEncrypted);
  const decryptedRefresh = decryptToken(conn.refreshTokenEncrypted);

  if (!decryptedAccess && !decryptedRefresh) {
    return null;
  }

  const now = new Date();
  const isExpired = !conn.tokenExpiresAt || conn.tokenExpiresAt.getTime() - now.getTime() < 60_000;

  // If still valid, return current access token
  if (!isExpired && decryptedAccess) {
    return { accessToken: decryptedAccess, locationId: conn.locationId };
  }

  // Token is expired; attempt refresh if refresh token available
  if (decryptedRefresh) {
    try {
      const refreshed = await refreshAccessToken(decryptedRefresh);
      const newEncryptedAccess = encryptToken(refreshed.accessToken);
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

      await prisma.googleBusinessAccount.update({
        where: { id: CONNECTION_SINGLETON_ID },
        data: {
          accessTokenEncrypted: newEncryptedAccess,
          tokenExpiresAt: newExpiresAt,
          lastSyncError: null,
        },
      });

      return { accessToken: refreshed.accessToken, locationId: conn.locationId };
    } catch (err) {
      console.error('Failed to refresh Google access token:', err);
      await prisma.googleBusinessAccount.update({
        where: { id: CONNECTION_SINGLETON_ID },
        data: {
          lastSyncError: 'Token refresh failed. Please reconnect your Google account.',
        },
      });
      return null;
    }
  }

  return null;
}

/**
 * Saves or updates the Google Business Account connection.
 * Encrypts tokens at rest using AES-256-GCM.
 */
export async function saveGoogleConnection(params: {
  accountId: string;
  accountName: string;
  locationId: string;
  locationName: string;
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds: number;
  scopes?: string;
}) {
  const tokenExpiresAt = new Date(Date.now() + params.expiresInSeconds * 1000);
  const encryptedAccess = encryptToken(params.accessToken);
  const encryptedRefresh = params.refreshToken ? encryptToken(params.refreshToken) : undefined;

  return prisma.googleBusinessAccount.upsert({
    where: { id: CONNECTION_SINGLETON_ID },
    create: {
      id: CONNECTION_SINGLETON_ID,
      accountId: params.accountId,
      accountName: params.accountName,
      locationId: params.locationId,
      locationName: params.locationName,
      accessTokenEncrypted: encryptedAccess,
      refreshTokenEncrypted: encryptedRefresh || null,
      tokenExpiresAt,
      scopes: params.scopes || null,
      isConnected: true,
      lastSyncError: null,
    },
    update: {
      accountId: params.accountId,
      accountName: params.accountName,
      locationId: params.locationId,
      locationName: params.locationName,
      accessTokenEncrypted: encryptedAccess,
      ...(encryptedRefresh ? { refreshTokenEncrypted: encryptedRefresh } : {}),
      tokenExpiresAt,
      scopes: params.scopes || null,
      isConnected: true,
      lastSyncError: null,
    },
  });
}

/**
 * Disconnects the Google Business Account and clears stored tokens.
 */
export async function disconnectGoogleAccount(): Promise<void> {
  await prisma.googleBusinessAccount.update({
    where: { id: CONNECTION_SINGLETON_ID },
    data: {
      isConnected: false,
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      lastSyncError: null,
    },
  });
}

/**
 * Synchronizes reviews from the official Google Business Profile API.
 * Uses upsert to guarantee idempotency and avoid duplicates.
 */
export async function syncGoogleReviewsFromApi(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  const auth = await getValidAccessToken();
  if (!auth) {
    return {
      success: false,
      syncedCount: 0,
      message: 'No active Google Business Profile connection. Please connect your Google account.',
    };
  }

  try {
    const data = await fetchGoogleReviews(auth.accessToken, auth.locationId, 100);
    const reviews: GoogleReviewItemFromApi[] = data.reviews || [];

    let count = 0;
    for (const rev of reviews) {
      const starRating = mapStarRatingToNumber(rev.starRating);
      const googleReviewId = rev.name; // Full resource name is guaranteed unique
      const reviewerName = rev.reviewer?.displayName || 'Google User';
      const reviewerPhotoUrl = rev.reviewer?.profilePhotoUrl || null;
      const comment = rev.comment?.trim() || null;
      const reviewCreatedAt = new Date(rev.createTime);
      const reviewUpdatedAt = rev.updateTime ? new Date(rev.updateTime) : null;

      const replyText = rev.reviewReply?.comment?.trim() || null;
      const replyUpdatedAt = rev.reviewReply?.updateTime ? new Date(rev.reviewReply.updateTime) : null;
      const replyStatus = replyText ? 'REPLIED' : 'UNREPLIED';

      await prisma.googleReview.upsert({
        where: { googleReviewId },
        create: {
          googleReviewId,
          reviewerName,
          reviewerPhotoUrl,
          starRating,
          comment,
          reviewCreatedAt,
          reviewUpdatedAt,
          replyText,
          replyUpdatedAt,
          replyStatus,
        },
        update: {
          reviewerName,
          reviewerPhotoUrl,
          starRating,
          comment,
          reviewUpdatedAt,
          replyText,
          replyUpdatedAt,
          replyStatus,
        },
      });
      count++;
    }

    // Update lastSyncAt on connection
    await prisma.googleBusinessAccount.update({
      where: { id: CONNECTION_SINGLETON_ID },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: null,
      },
    });

    return {
      success: true,
      syncedCount: count,
      message: `Successfully synchronized ${count} review${count === 1 ? '' : 's'} from Google.`,
    };
  } catch (error) {
    console.error('Error synchronizing Google reviews:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown synchronization error';
    await prisma.googleBusinessAccount.update({
      where: { id: CONNECTION_SINGLETON_ID },
      data: {
        lastSyncError: errorMsg,
      },
    });

    return {
      success: false,
      syncedCount: 0,
      message: errorMsg,
    };
  }
}

/**
 * Review query filters.
 */
export interface ListGoogleReviewsOptions {
  replyStatus?: 'ALL' | 'REPLIED' | 'UNREPLIED';
  ratingFilter?: 'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Lists synchronized Google reviews with filtering, search, and pagination.
 */
export async function listGoogleReviews(options: ListGoogleReviewsOptions = {}) {
  const {
    replyStatus = 'ALL',
    ratingFilter = 'ALL',
    searchQuery = '',
    page = 1,
    pageSize = 15,
  } = options;

  const where: any = {};

  if (replyStatus === 'REPLIED') {
    where.replyStatus = 'REPLIED';
  } else if (replyStatus === 'UNREPLIED') {
    where.replyStatus = { not: 'REPLIED' };
  }

  if (ratingFilter === 'POSITIVE') {
    where.starRating = { gte: 4 };
  } else if (ratingFilter === 'NEUTRAL') {
    where.starRating = 3;
  } else if (ratingFilter === 'NEGATIVE') {
    where.starRating = { lte: 2 };
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    where.OR = [
      { reviewerName: { contains: q, mode: 'insensitive' } },
      { comment: { contains: q, mode: 'insensitive' } },
      { replyText: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (Math.max(1, page) - 1) * pageSize;

  const [totalCount, items] = await Promise.all([
    prisma.googleReview.count({ where }),
    prisma.googleReview.findMany({
      where,
      orderBy: [{ reviewCreatedAt: 'desc' }],
      skip,
      take: pageSize,
      include: {
        drafts: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    }),
  ]);

  return {
    reviews: items,
    totalCount,
    currentPage: page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  };
}

/**
 * Retrieves a single Google review with all its drafts.
 */
export async function getGoogleReviewById(id: string) {
  return prisma.googleReview.findUnique({
    where: { id },
    include: {
      drafts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Saves or updates an AI reply draft for a specific review.
 */
export async function saveGoogleReviewDraft(params: {
  reviewId: string;
  draftText: string;
  language: 'en' | 'gujlish' | 'hinglish';
}) {
  const draft = await prisma.googleReviewReplyDraft.create({
    data: {
      reviewId: params.reviewId,
      draftText: params.draftText,
      language: params.language,
      isApproved: false,
      isPublished: false,
    },
  });

  // Update review status to DRAFT_CREATED if not already replied
  await prisma.googleReview.updateMany({
    where: {
      id: params.reviewId,
      replyStatus: 'UNREPLIED',
    },
    data: {
      replyStatus: 'DRAFT_CREATED',
    },
  });

  return draft;
}

/**
 * Records a successfully published reply in the database.
 */
export async function markReplyAsPublished(params: {
  reviewId: string;
  replyText: string;
  draftId?: string;
}) {
  const now = new Date();

  if (params.draftId) {
    await prisma.googleReviewReplyDraft.update({
      where: { id: params.draftId },
      data: {
        isApproved: true,
        isPublished: true,
        publishedAt: now,
      },
    });
  }

  return prisma.googleReview.update({
    where: { id: params.reviewId },
    data: {
      replyText: params.replyText,
      replyUpdatedAt: now,
      replyStatus: 'REPLIED',
    },
  });
}

/**
 * Computes real statistics based exclusively on database records.
 */
export async function getGoogleReviewStats(): Promise<GoogleReviewStats> {
  const [totalSynced, repliedCount, aggregations, aiDraftsGenerated, publishedReplies] =
    await Promise.all([
      prisma.googleReview.count(),
      prisma.googleReview.count({ where: { replyStatus: 'REPLIED' } }),
      prisma.googleReview.aggregate({
        _avg: { starRating: true },
      }),
      prisma.googleReviewReplyDraft.count(),
      prisma.googleReviewReplyDraft.count({ where: { isPublished: true } }),
    ]);

  const unrepliedCount = totalSynced - repliedCount;
  const averageRating = aggregations._avg.starRating
    ? Number(aggregations._avg.starRating.toFixed(1))
    : 0;
  const replyCoveragePercentage = totalSynced > 0
    ? Number(((repliedCount / totalSynced) * 100).toFixed(1))
    : 0;

  return {
    totalSynced,
    repliedCount,
    unrepliedCount: Math.max(0, unrepliedCount),
    averageRating,
    replyCoveragePercentage,
    aiDraftsGenerated,
    publishedReplies,
  };
}
