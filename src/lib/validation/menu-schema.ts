import { z } from 'zod';
import { isValidExternalUrl } from '@/lib/format/contact-links';

export const MenuItemVariantSchema = z.object({
  name: z.string().trim().min(1, 'Variant name required').max(50),
  price: z.coerce.number().min(0, 'Price must be positive'),
});

export const MenuItemAddonSchema = z.object({
  name: z.string().trim().min(1, 'Add-on name required').max(50),
  price: z.coerce.number().min(0, 'Price must be positive'),
});

export const MenuCategoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Category name required').max(80),
  description: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : val), z.string().trim().max(300).nullable().optional()),
  icon: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : val), z.string().trim().max(50).nullable().optional()),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type MenuCategoryInput = z.infer<typeof MenuCategoryInputSchema>;

export const MenuItemInputSchema = z.object({
  name: z.string().trim().min(1, 'Dish name required').max(120),
  description: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : val), z.string().trim().max(600).nullable().optional()),
  imageUrl: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : val), z.string().trim().nullable().optional())
    .refine((val) => !val || val.startsWith('/uploads/') || val.startsWith('data:image/') || isValidExternalUrl(val), {
      message: 'Image must be a valid URL or image path',
    }),
  categoryId: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : val), z.string().trim().nullable().optional()),
  categoryName: z.string().trim().optional().default('General'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  originalPrice: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.coerce.number().min(0, 'Original price must be positive').nullable().optional()
    ),
  isVeg: z.coerce.boolean().default(true),
  dietaryLabels: z.array(z.string().trim()).default([]),
  spiceLevel: z.coerce.number().int().min(0).max(3).default(0),
  servingInfo: z
    .preprocess((val) => (val === '' || val === null || val === undefined ? null : val), z.string().trim().max(80).nullable().optional()),
  variants: z.array(MenuItemVariantSchema).default([]),
  addons: z.array(MenuItemAddonSchema).default([]),
  isAvailable: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export type MenuItemInput = z.input<typeof MenuItemInputSchema>;
export type MenuItemOutput = z.infer<typeof MenuItemInputSchema>;
