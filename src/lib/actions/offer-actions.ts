'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getOfferById,
} from '@/lib/repositories/offer-repository';
import {
  CreateOfferInputSchema,
  UpdateOfferInputSchema,
  type CreateOfferInput,
  type UpdateOfferInput,
} from '@/lib/validation/offer-schema';
import type { DomainOffer } from '@/lib/domain/types';

export interface OfferActionResult {
  success: boolean;
  message?: string;
  offer?: DomainOffer;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action to create a new promotional offer.
 * Strictly requires authenticated pharmacy admin session.
 */
export async function createOfferAction(input: CreateOfferInput): Promise<OfferActionResult> {
  await requireAdmin('/admin/offers');

  const parsed = CreateOfferInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      message: 'Please resolve the errors highlighted below.',
      fieldErrors,
    };
  }

  try {
    const offer = await createOffer(parsed.data);

    // Revalidate affected customer & admin routes
    revalidatePath('/admin/offers');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return {
      success: true,
      message: 'Offer published successfully.',
      offer,
    };
  } catch (error) {
    console.error('Failed to create offer:', error);
    return {
      success: false,
      message: 'Failed to create offer. Please try again.',
    };
  }
}

/**
 * Server action to update an existing promotional offer.
 * Strictly requires authenticated pharmacy admin session.
 */
export async function updateOfferAction(
  id: string,
  input: UpdateOfferInput
): Promise<OfferActionResult> {
  await requireAdmin('/admin/offers');

  if (!id || typeof id !== 'string') {
    return { success: false, message: 'Invalid offer ID.' };
  }

  const existing = await getOfferById(id);
  if (!existing) {
    return { success: false, message: 'Offer not found.' };
  }

  const parsed = UpdateOfferInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      message: 'Please resolve the errors highlighted below.',
      fieldErrors,
    };
  }

  try {
    const updated = await updateOffer(id, parsed.data);
    if (!updated) {
      return { success: false, message: 'Could not update offer.' };
    }

    revalidatePath('/admin/offers');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return {
      success: true,
      message: 'Offer updated successfully.',
      offer: updated,
    };
  } catch (error) {
    console.error('Failed to update offer:', error);
    return {
      success: false,
      message: 'Failed to update offer. Please try again.',
    };
  }
}

/**
 * Server action to toggle offer active state (Active <-> Inactive).
 * Strictly requires authenticated pharmacy admin session.
 */
export async function toggleOfferActiveAction(id: string): Promise<OfferActionResult> {
  await requireAdmin('/admin/offers');

  if (!id || typeof id !== 'string') {
    return { success: false, message: 'Invalid offer ID.' };
  }

  const existing = await getOfferById(id);
  if (!existing) {
    return { success: false, message: 'Offer not found.' };
  }

  const nextState = !existing.isActive;

  try {
    const updated = await updateOffer(id, { isActive: nextState });
    if (!updated) {
      return { success: false, message: 'Could not toggle offer status.' };
    }

    revalidatePath('/admin/offers');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return {
      success: true,
      message: nextState ? 'Offer activated.' : 'Offer deactivated.',
      offer: updated,
    };
  } catch (error) {
    console.error('Failed to toggle offer status:', error);
    return {
      success: false,
      message: 'Failed to toggle offer status. Please try again.',
    };
  }
}

/**
 * Server action to permanently delete a promotional offer.
 * Strictly requires authenticated pharmacy admin session.
 */
export async function deleteOfferAction(id: string): Promise<OfferActionResult> {
  await requireAdmin('/admin/offers');

  if (!id || typeof id !== 'string') {
    return { success: false, message: 'Invalid offer ID.' };
  }

  const existing = await getOfferById(id);
  if (!existing) {
    return { success: false, message: 'Offer not found.' };
  }

  try {
    const deleted = await deleteOffer(id);
    if (!deleted) {
      return { success: false, message: 'Could not delete offer.' };
    }

    revalidatePath('/admin/offers');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return {
      success: true,
      message: 'Offer deleted successfully.',
    };
  } catch (error) {
    console.error('Failed to delete offer:', error);
    return {
      success: false,
      message: 'Failed to delete offer. Please try again.',
    };
  }
}
