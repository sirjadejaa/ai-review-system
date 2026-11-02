'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from '@/lib/repositories/product-repository';
import {
  ProductInputSchema,
  type ProductInput,
} from '@/lib/validation/product-schema';
import type { DomainProduct } from '@/lib/domain/types';

export interface ProductActionResult {
  success: boolean;
  message?: string;
  product?: DomainProduct;
  fieldErrors?: Record<string, string>;
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB

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
 * Creates a new product. Strictly requires authenticated admin.
 */
export async function createProductAction(input: ProductInput): Promise<ProductActionResult> {
  await requireAdmin('/admin/products');

  const parsed = ProductInputSchema.safeParse(input);
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
      message: 'Please resolve the highlighted errors.',
      fieldErrors,
    };
  }

  try {
    const created = await createProduct(parsed.data);

    revalidatePath('/admin/products');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return {
      success: true,
      message: 'Product created successfully.',
      product: created,
    };
  } catch (error) {
    console.error('Failed to create product:', error);
    return {
      success: false,
      message: 'Failed to create product. Please try again.',
    };
  }
}

/**
 * Updates an existing product. Strictly requires authenticated admin.
 */
export async function updateProductAction(
  id: string,
  input: Partial<ProductInput>
): Promise<ProductActionResult> {
  await requireAdmin('/admin/products');

  if (!id || typeof id !== 'string') {
    return { success: false, message: 'Invalid product ID' };
  }

  try {
    const updated = await updateProduct(id, input);
    if (!updated) {
      return { success: false, message: 'Product not found.' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return {
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    };
  } catch (error) {
    console.error('Failed to update product:', error);
    return {
      success: false,
      message: 'Failed to update product. Please try again.',
    };
  }
}

/**
 * Deletes a product permanently. Strictly requires authenticated admin.
 */
export async function deleteProductAction(id: string): Promise<{ success: boolean; message: string }> {
  await requireAdmin('/admin/products');

  if (!id || typeof id !== 'string') {
    return { success: false, message: 'Invalid product ID' };
  }

  try {
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return { success: false, message: 'Product not found or already deleted.' };
    }

    revalidatePath('/admin/products');
    revalidatePath('/customer/card');
    revalidatePath('/');

    return { success: true, message: 'Product deleted successfully.' };
  } catch (error) {
    console.error('Failed to delete product:', error);
    return { success: false, message: 'Failed to delete product. Please try again.' };
  }
}

/**
 * Toggles product active visibility status.
 */
export async function toggleProductActiveAction(
  id: string,
  currentStatus: boolean
): Promise<ProductActionResult> {
  await requireAdmin('/admin/products');

  return updateProductAction(id, { isActive: !currentStatus });
}

/**
 * Toggles whether product is featured on the home customer showcase.
 */
export async function toggleProductFeaturedAction(
  id: string,
  currentStatus: boolean
): Promise<ProductActionResult> {
  await requireAdmin('/admin/products');

  return updateProductAction(id, { isFeatured: !currentStatus });
}

/**
 * Uploads a product image with persistent data-URI encoding.
 */
export async function uploadProductImageAction(
  formData: FormData
): Promise<{ success: boolean; message: string; imageUrl?: string }> {
  try {
    await requireAdmin('/admin/products');

    const file = formData.get('image');
    if (!file || !(file instanceof File)) {
      return { success: false, message: 'Please select an image file to upload.' };
    }

    if (file.size === 0) {
      return { success: false, message: 'Uploaded file is empty.' };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        message: 'Image exceeds 4 MB limit. Please choose a smaller photo.',
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
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    return {
      success: true,
      message: 'Product image uploaded successfully.',
      imageUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Failed to upload product image:', error);
    return { success: false, message: 'Failed to upload image. Please try again.' };
  }
}
