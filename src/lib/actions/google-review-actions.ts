'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  syncGoogleReviewsFromApi,
  getGoogleReviewById,
  saveGoogleReviewDraft,
  markReplyAsPublished,
  getValidAccessToken,
  disconnectGoogleAccount,
} from '@/lib/repositories/google-review-repository';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { publishGoogleReviewReply } from '@/lib/google/client';
import { generateOwnerReply } from '@/lib/ai/owner-reply';

/**
 * Server Action to manually synchronize reviews from Google Business Profile.
 * Strictly requires authenticated store admin.
 */
export async function syncGoogleReviewsAction(): Promise<{
  success: boolean;
  message: string;
  syncedCount?: number;
}> {
  await requireAdmin('/admin/google-reviews');

  try {
    const result = await syncGoogleReviewsFromApi();
    revalidatePath('/admin/google-reviews');
    return result;
  } catch (error) {
    console.error('Failed to synchronize Google reviews:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Synchronization failed. Please check connection.',
    };
  }
}

/**
 * Server Action to generate an AI owner reply draft for a review.
 * Strictly requires authenticated store admin.
 */
export async function generateAIReplyAction(params: {
  reviewId: string;
  language: 'en' | 'hi' | 'gu';
}): Promise<{
  success: boolean;
  message: string;
  draftText?: string;
  draftId?: string;
}> {
  await requireAdmin('/admin/google-reviews');

  const { reviewId, language } = params;
  if (!reviewId) {
    return { success: false, message: 'Invalid review ID.' };
  }

  try {
    const [review, settings] = await Promise.all([
      getGoogleReviewById(reviewId),
      getShopSettings(),
    ]);

    if (!review) {
      return { success: false, message: 'Review not found.' };
    }

    const shopName = settings?.shopName && settings.shopName !== 'Pharmacy'
      ? settings.shopName
      : 'Maison & Thread';

    const draftText = await generateOwnerReply({
      reviewerName: review.reviewerName,
      rating: review.starRating,
      reviewText: review.comment,
      shopName,
      language,
    });

    // Save generated draft to database
    const saved = await saveGoogleReviewDraft({
      reviewId,
      draftText,
      language,
    });

    revalidatePath('/admin/google-reviews');

    return {
      success: true,
      message: 'AI reply draft generated.',
      draftText,
      draftId: saved.id,
    };
  } catch (error) {
    console.error('Failed to generate AI owner reply:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate AI reply draft.',
    };
  }
}

/**
 * Server Action to save an edited owner reply draft.
 */
export async function saveReplyDraftAction(params: {
  reviewId: string;
  draftText: string;
  language: 'en' | 'hi' | 'gu';
}): Promise<{ success: boolean; message: string; draftId?: string }> {
  await requireAdmin('/admin/google-reviews');

  if (!params.reviewId || !params.draftText.trim()) {
    return { success: false, message: 'Reply draft cannot be empty.' };
  }

  try {
    const saved = await saveGoogleReviewDraft({
      reviewId: params.reviewId,
      draftText: params.draftText.trim(),
      language: params.language,
    });

    revalidatePath('/admin/google-reviews');
    return { success: true, message: 'Draft saved successfully.', draftId: saved.id };
  } catch (error) {
    console.error('Failed to save reply draft:', error);
    return { success: false, message: 'Failed to save draft.' };
  }
}

/**
 * Server Action to publish an approved owner reply to Google Business Profile.
 * Never publishes without explicit admin action and confirmed Google API response.
 */
export async function publishReplyAction(params: {
  reviewId: string;
  replyText: string;
  draftId?: string;
}): Promise<{ success: boolean; message: string }> {
  await requireAdmin('/admin/google-reviews');

  const { reviewId, replyText, draftId } = params;
  const trimmedReply = replyText?.trim();

  if (!reviewId || !trimmedReply) {
    return { success: false, message: 'Reply text cannot be empty.' };
  }

  const review = await getGoogleReviewById(reviewId);
  if (!review) {
    return { success: false, message: 'Review not found.' };
  }

  // Retrieve valid access token
  const auth = await getValidAccessToken();
  if (!auth) {
    return {
      success: false,
      message: 'No active Google Business Profile connection. Please connect your Google account before publishing.',
    };
  }

  try {
    // Submit reply to Google via authorized API
    await publishGoogleReviewReply(auth.accessToken, review.googleReviewId, trimmedReply);

    // Update local database only after confirmed Google response
    await markReplyAsPublished({
      reviewId,
      replyText: trimmedReply,
      draftId,
    });

    revalidatePath('/admin/google-reviews');

    return {
      success: true,
      message: 'Owner reply successfully published to Google Business Profile!',
    };
  } catch (error) {
    console.error('Failed to publish reply to Google:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Google API rejected reply submission.',
    };
  }
}

/**
 * Server Action to disconnect the Google Business Account.
 */
export async function disconnectGoogleAction(): Promise<{ success: boolean; message: string }> {
  await requireAdmin('/admin/google-reviews');

  try {
    await disconnectGoogleAccount();
    revalidatePath('/admin/google-reviews');
    return { success: true, message: 'Google account disconnected successfully.' };
  } catch (error) {
    console.error('Failed to disconnect Google account:', error);
    return { success: false, message: 'Failed to disconnect account.' };
  }
}
