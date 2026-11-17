'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  reorderMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  getMenuItemById,
} from '@/lib/repositories/menu-repository';
import {
  MenuCategoryInputSchema,
  MenuItemInputSchema,
  type MenuCategoryInput,
  type MenuItemInput,
} from '@/lib/validation/menu-schema';
import type { DomainMenuCategory, DomainMenuItem } from '@/lib/domain/menu-types';

export interface MenuActionResult<T> {
  success: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string>;
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

export async function createMenuCategoryAction(
  input: MenuCategoryInput
): Promise<MenuActionResult<DomainMenuCategory>> {
  await requireAdmin('/admin/menu');

  const parsed = MenuCategoryInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { success: false, message: 'Please correct category errors', fieldErrors };
  }

  try {
    const category = await createMenuCategory(parsed.data);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Menu category created successfully', data: category };
  } catch (err) {
    console.error('Error creating menu category:', err);
    return { success: false, message: 'Failed to create category. Please try again.' };
  }
}

export async function updateMenuCategoryAction(
  id: string,
  input: Partial<MenuCategoryInput>
): Promise<MenuActionResult<DomainMenuCategory>> {
  await requireAdmin('/admin/menu');

  try {
    const category = await updateMenuCategory(id, input);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Category updated successfully', data: category };
  } catch (err) {
    console.error('Error updating category:', err);
    return { success: false, message: 'Failed to update category.' };
  }
}

export async function deleteMenuCategoryAction(
  id: string
): Promise<MenuActionResult<null>> {
  await requireAdmin('/admin/menu');

  try {
    await deleteMenuCategory(id);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Category removed successfully' };
  } catch (err) {
    console.error('Error deleting category:', err);
    return { success: false, message: 'Failed to delete category.' };
  }
}

export async function reorderMenuCategoriesAction(
  orderedIds: string[]
): Promise<MenuActionResult<null>> {
  await requireAdmin('/admin/menu');

  try {
    await reorderMenuCategories(orderedIds);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Categories reordered successfully' };
  } catch (err) {
    console.error('Error reordering categories:', err);
    return { success: false, message: 'Failed to save category order.' };
  }
}

// ---------------------------------------------------------------------------
// MENU ITEMS
// ---------------------------------------------------------------------------

export async function createMenuItemAction(
  input: MenuItemInput
): Promise<MenuActionResult<DomainMenuItem>> {
  await requireAdmin('/admin/menu');

  const parsed = MenuItemInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { success: false, message: 'Please correct dish errors', fieldErrors };
  }

  try {
    const item = await createMenuItem(parsed.data);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Dish added to menu successfully', data: item };
  } catch (err) {
    console.error('Error creating menu item:', err);
    return { success: false, message: 'Failed to add dish. Please try again.' };
  }
}

export async function updateMenuItemAction(
  id: string,
  input: Partial<MenuItemInput>
): Promise<MenuActionResult<DomainMenuItem>> {
  await requireAdmin('/admin/menu');

  try {
    const item = await updateMenuItem(id, input);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Dish updated successfully', data: item };
  } catch (err) {
    console.error('Error updating menu item:', err);
    return { success: false, message: 'Failed to update dish.' };
  }
}

export async function deleteMenuItemAction(
  id: string
): Promise<MenuActionResult<null>> {
  await requireAdmin('/admin/menu');

  try {
    const existing = await getMenuItemById(id);
    if (!existing) return { success: false, message: 'Dish not found' };

    await deleteMenuItem(id);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return { success: true, message: 'Dish removed from menu' };
  } catch (err) {
    console.error('Error deleting menu item:', err);
    return { success: false, message: 'Failed to delete dish.' };
  }
}

export async function toggleMenuItemAvailabilityAction(
  id: string
): Promise<MenuActionResult<DomainMenuItem>> {
  await requireAdmin('/admin/menu');

  try {
    const updated = await toggleMenuItemAvailability(id);
    revalidatePath('/');
    revalidatePath('/admin/menu');
    return {
      success: true,
      message: updated.isAvailable ? 'Dish is now available' : 'Dish marked as sold out',
      data: updated,
    };
  } catch (err) {
    console.error('Error toggling dish availability:', err);
    return { success: false, message: 'Failed to update dish availability.' };
  }
}

export async function uploadMenuItemImageAction(
  formData: FormData
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  await requireAdmin('/admin/menu');

  const file = formData.get('file') as File | null;
  if (!file) return { success: false, error: 'No image file provided' };

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { success: false, error: 'Only PNG, JPEG, and WebP images are allowed' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: 'Image file size cannot exceed 5 MB' };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!isValidImageMagicBytes(buffer, file.type)) {
    return { success: false, error: 'Invalid image format detected' };
  }

  const base64Data = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64Data}`;

  return { success: true, imageUrl: dataUrl };
}
