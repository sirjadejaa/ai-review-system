import { z } from 'zod';
import { isValidExternalUrl } from '@/lib/format/contact-links';

export const OpeningHourSlotSchema = z.object({
  days: z.string().trim().min(1, 'Days description cannot be empty').max(50, 'Days description cannot exceed 50 characters'),
  hours: z.string().trim().min(1, 'Hours description cannot be empty').max(50, 'Hours description cannot exceed 50 characters'),
});

const SafeUrlSchema = z
  .preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.string().trim().nullable().optional()
  )
  .refine((val) => !val || isValidExternalUrl(val), {
    message: 'Must be a valid http:// or https:// URL',
  });

export const ShopSettingsInputSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, 'Shop name must be at least 2 characters')
    .max(100, 'Shop name must be at most 100 characters'),
  tagline: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(150, 'Tagline must be at most 150 characters').nullable().optional()
    ),
  logoUrl: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().nullable().optional()
    )
    .refine((val) => !val || val.startsWith('/uploads/') || val.startsWith('data:image/') || isValidExternalUrl(val), {
      message: 'Logo must be a valid image URL or upload path',
    }),
  phoneNumber: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(20, 'Phone number must be at most 20 characters').nullable().optional()
    ),
  whatsappNumber: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(20, 'WhatsApp number must be at most 20 characters').nullable().optional()
    ),
  address: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(250, 'Address must be at most 250 characters').nullable().optional()
    ),
  googleMapsUrl: SafeUrlSchema,
  googleReviewUrl: SafeUrlSchema,
  openingHours: z.array(OpeningHourSlotSchema).default([]),
  isEmergencyOpen: z.coerce.boolean().default(false),
});

export type ShopSettingsInput = z.input<typeof ShopSettingsInputSchema>;

