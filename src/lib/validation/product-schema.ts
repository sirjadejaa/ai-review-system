import { z } from 'zod';

export const DEFAULT_PRODUCT_CATEGORIES = [
  "Women's Wear",
  "Men's Wear",
  "Kids' Wear",
  "Traditional Wear",
  "Western Wear",
  "Ethnic Wear",
  "Accessories",
  "New Arrivals",
] as const;

export const ProductInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(120, 'Product name cannot exceed 120 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        return (
          val.startsWith('https://') ||
          val.startsWith('http://') ||
          val.startsWith('data:image/') ||
          val.startsWith('/')
        );
      },
      { message: 'Image must be a valid HTTPS URL, local path, or base64 image' }
    )
    .optional()
    .nullable(),
  category: z
    .string()
    .trim()
    .min(1, 'Category cannot be empty')
    .max(60, 'Category cannot exceed 60 characters')
    .default('General'),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(10000000, 'Price exceeds maximum allowed value')
    .optional()
    .nullable(),
  originalPrice: z
    .number()
    .min(0, 'Original price cannot be negative')
    .max(10000000, 'Original price exceeds maximum allowed value')
    .optional()
    .nullable(),
  sizes: z
    .array(z.string().trim().max(20))
    .max(20, 'Cannot exceed 20 size variations')
    .default([]),
  colors: z
    .array(z.string().trim().max(30))
    .max(20, 'Cannot exceed 20 color variations')
    .default([]),
  isFeatured: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  productUrl: z
    .string()
    .trim()
    .refine(
      (val) => {
        if (!val) return true;
        return val.startsWith('https://') || val.startsWith('http://') || val.startsWith('/');
      },
      { message: 'Product link must be a valid URL' }
    )
    .optional()
    .nullable(),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

export const UpdateProductInputSchema = ProductInputSchema.partial().extend({
  id: z.string().min(1, 'Product ID is required'),
});

export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;
