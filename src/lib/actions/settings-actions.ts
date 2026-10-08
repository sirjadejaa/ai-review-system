'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { updateShopSettings } from '@/lib/repositories/shop-settings-repository';
import {
  ShopSettingsInputSchema,
  type ShopSettingsInput,
} from '@/lib/validation/shop-settings-schema';
import type { DomainShopSettings } from '@/lib/domain/types';

export interface SettingsActionResult {
  success: boolean;
  message?: string;
  settings?: DomainShopSettings;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action to update singleton pharmacy settings.
 * Strictly requires authenticated pharmacy admin session.
 */
export async function updateShopSettingsAction(
  input: ShopSettingsInput
): Promise<SettingsActionResult> {
  await requireAdmin('/admin/settings');

  const parsed = ShopSettingsInputSchema.safeParse(input);
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
    const updated = await updateShopSettings(parsed.data);

    // Revalidate customer-facing pages and admin portal
    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    revalidatePath('/customer/card');
    revalidatePath('/customer/review');
    revalidatePath('/');

    return {
      success: true,
      message: 'Pharmacy information and settings saved successfully.',
      settings: updated,
    };
  } catch (error) {
    console.error('Failed to update shop settings:', error);
    return {
      success: false,
      message: 'Failed to save settings. Please try again.',
    };
  }
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MAX_LOGO_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB

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
 * Server action to securely upload and persist the pharmacy business logo.
 * Enforces file size limits, MIME type verification, and magic byte checking.
 */
export async function uploadPharmacyLogoAction(
  formData: FormData
): Promise<{ success: boolean; message: string; logoUrl?: string }> {
  try {
    await requireAdmin('/admin/settings');

    const file = formData.get('logo');
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'Please select a valid image file to upload.' };
    }

    if (file.size === 0) {
      return { success: false, message: 'The uploaded file is empty.' };
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return {
        success: false,
        message: 'File size exceeds 3 MB limit. Please choose a smaller image.',
      };
    }

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
      return {
        success: false,
        message: 'Invalid image format. Only PNG, JPEG, and WebP logos are supported.',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isValidImageMagicBytes(buffer, mimeType)) {
      return {
        success: false,
        message: 'Corrupted or invalid image data. Please upload a standard PNG, JPEG, or WebP.',
      };
    }

    // Generate persistent data URI stored directly in database to guarantee zero filesystem disappearance
    const base64Data = buffer.toString('base64');
    const logoUrl = `data:${mimeType};base64,${base64Data}`;

    const { getShopSettings, updateShopSettings: repoUpdate } = await import(
      '@/lib/repositories/shop-settings-repository'
    );
    const current = await getShopSettings();
    const updated = await repoUpdate({
      shopName: current.shopName,
      tagline: current.tagline,
      phoneNumber: current.phoneNumber,
      whatsappNumber: current.whatsappNumber,
      address: current.address,
      googleMapsUrl: current.googleMapsUrl,
      googleReviewUrl: current.googleReviewUrl,
      openingHours: current.openingHours,
      isEmergencyOpen: current.isEmergencyOpen,
      logoUrl,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    revalidatePath('/customer/card');
    revalidatePath('/customer/review');
    revalidatePath('/');

    return {
      success: true,
      message: 'Logo uploaded and updated successfully.',
      logoUrl: updated.logoUrl ?? logoUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Failed to upload pharmacy logo:', error);
    return { success: false, message: 'Failed to upload logo. Please try again.' };
  }
}

/**
 * Server action to remove the current pharmacy business logo.
 */
export async function removePharmacyLogoAction(): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin('/admin/settings');

    const current = await (await import('@/lib/repositories/shop-settings-repository')).getShopSettings();
    await updateShopSettings({
      shopName: current.shopName,
      tagline: current.tagline,
      phoneNumber: current.phoneNumber,
      whatsappNumber: current.whatsappNumber,
      address: current.address,
      googleMapsUrl: current.googleMapsUrl,
      googleReviewUrl: current.googleReviewUrl,
      openingHours: current.openingHours,
      isEmergencyOpen: current.isEmergencyOpen,
      logoUrl: null,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    revalidatePath('/customer/card');
    revalidatePath('/customer/review');
    revalidatePath('/');

    return { success: true, message: 'Pharmacy logo removed successfully.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Failed to remove pharmacy logo:', error);
    return { success: false, message: 'Failed to remove logo. Please try again.' };
  }
}
