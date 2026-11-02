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
 * Strictly requires authenticated boutique admin session.
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
 * Strictly requires authenticated boutique admin session.
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
 * Strictly requires authenticated boutique admin session.
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
 * Strictly requires authenticated boutique admin session.
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

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MAX_BANNER_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

function isValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }
  return false;
}

/**
 * Uploads an offer banner with persistent data-URI encoding.
 */
export async function uploadOfferBannerAction(
  formData: FormData
): Promise<{ success: boolean; message: string; bannerUrl?: string }> {
  try {
    await requireAdmin('/admin/offers');

    const file = formData.get('banner');
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'Please select a banner image file to upload.' };
    }

    if (file.size === 0) {
      return { success: false, message: 'Uploaded banner file is empty.' };
    }

    if (file.size > MAX_BANNER_SIZE_BYTES) {
      return {
        success: false,
        message: 'Banner image exceeds 4 MB limit. Please choose a smaller image.',
      };
    }

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
      return {
        success: false,
        message: 'Invalid image format. Supported formats: PNG, JPEG, and WebP.',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageMagicBytes(buffer, mimeType)) {
      return {
        success: false,
        message: 'Corrupted or invalid image data. Please upload a standard image file.',
      };
    }

    const base64Data = buffer.toString('base64');
    const bannerUrl = `data:${mimeType};base64,${base64Data}`;

    return {
      success: true,
      message: 'Offer banner uploaded successfully.',
      bannerUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Failed to upload offer banner:', error);
    return { success: false, message: 'Failed to upload banner. Please try again.' };
  }
}
