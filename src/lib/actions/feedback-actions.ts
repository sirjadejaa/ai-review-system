'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  createFeedback,
  updateFeedbackStatus,
} from '@/lib/repositories/feedback-repository';
import {
  CustomerFeedbackSubmissionSchema,
  UpdateFeedbackStatusSchema,
  type CustomerFeedbackSubmissionInput,
} from '@/lib/validation/feedback-schema';
import type { FeedbackStatus } from '@/lib/domain/types';
import {
  isFeedbackRateLimited,
  recordFeedbackSubmission,
} from '@/lib/feedback/rate-limiter';

export interface SubmitFeedbackResult {
  success: boolean;
  message?: string;
  fieldErrors?: {
    rating?: string;
    tags?: string;
    notes?: string;
    customerContact?: string;
  };
}

/**
 * Server action to process public customer feedback submissions.
 * Validates rating (1-5), checks tag whitelist, sanitizes strings, enforces rate limits,
 * and guarantees status is initialized to 'NEW'.
 */
export async function submitCustomerFeedbackAction(
  input: CustomerFeedbackSubmissionInput
): Promise<SubmitFeedbackResult> {
  try {
    // 1. Abuse protection: Check in-memory rate limiter per request context
    let clientKey = 'anonymous:client';
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get('x-forwarded-for');
      const userAgent = headerList.get('user-agent') || '';
      clientKey = `${forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous'}:${userAgent.slice(0, 32)}`;
    } catch {
      // In testing or background contexts where request store is absent, use fallback
      clientKey = 'test-environment-client';
    }

    const rateCheck = isFeedbackRateLimited(clientKey);
    if (rateCheck.isBlocked) {
      return {
        success: false,
        message: 'Too many feedback submissions. Please try again in a few minutes.',
      };
    }

    // 2. Server-side validation against strict schema
    const parsed = CustomerFeedbackSubmissionSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: SubmitFeedbackResult['fieldErrors'] = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof NonNullable<SubmitFeedbackResult['fieldErrors']>;
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }

      return {
        success: false,
        message: 'Please check your inputs and try again.',
        fieldErrors,
      };
    }

    // 3. Persist feedback via repository (forces status to 'NEW')
    await createFeedback({
      rating: parsed.data.rating,
      tags: parsed.data.tags,
      notes: parsed.data.notes ?? null,
      customerContact: parsed.data.customerContact ?? null,
    });

    // 4. Record successful submission in rate limiter
    recordFeedbackSubmission(clientKey);

    return {
      success: true,
      message: 'Thank you! Your feedback has been received.',
    };
  } catch (error) {
    // Never leak database or internal stack traces to the public customer
    console.error('Non-fatal: Failed to submit customer feedback', error);
    return {
      success: false,
      message: "We couldn't submit your feedback right now. Please try again.",
    };
  }
}

/**
 * Server action to update feedback status (NEW -> REVIEWED -> RESOLVED).
 * Strictly requires authenticated pharmacy admin session.
 */
export async function updateFeedbackStatusAction(
  id: string,
  status: FeedbackStatus
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin('/admin/reviews');

    const parsed = UpdateFeedbackStatusSchema.safeParse({ status });
    if (!parsed.success) {
      return {
        success: false,
        message: 'Invalid feedback status.',
      };
    }

    const updated = await updateFeedbackStatus(id, parsed.data.status);
    if (!updated) {
      return {
        success: false,
        message: 'Feedback record not found.',
      };
    }

    revalidatePath('/admin/reviews');
    revalidatePath('/admin');
    return {
      success: true,
      message: 'Feedback status updated successfully.',
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Non-fatal: Failed to update feedback status', error);
    return {
      success: false,
      message: 'Unauthorized or failed to update feedback status.',
    };
  }
}
