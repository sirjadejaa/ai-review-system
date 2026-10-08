import { z } from 'zod';

export function parseOfferExpiryDate(val: unknown): Date | null | undefined {
  if (val === undefined) return undefined;
  if (val === null || val === '') return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) throw new Error('Invalid date');
    return val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}T23:59:59.999Z`);
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      return d;
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) throw new Error('Invalid date');
    return d;
  }
  return undefined;
}

export const CreateOfferInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Offer title must be at least 2 characters')
    .max(100, 'Offer title cannot exceed 100 characters'),
  description: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(500, 'Offer description cannot exceed 500 characters').nullable().optional()
    ),
  badge: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(30, 'Offer badge cannot exceed 30 characters').nullable().optional()
    ),
  validUntil: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
        return new Date(`${val.trim()}T23:59:59.999Z`);
      }
      return val;
    },
    z.coerce.date().nullable().optional()
  ),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int('Sort order must be an integer').default(0),
});

export const UpdateOfferInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Offer title must be at least 2 characters')
    .max(100, 'Offer title cannot exceed 100 characters')
    .optional(),
  description: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(500, 'Offer description cannot exceed 500 characters').nullable().optional()
    ),
  badge: z
    .preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      z.string().trim().max(30, 'Offer badge cannot exceed 30 characters').nullable().optional()
    ),
  validUntil: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
        return new Date(`${val.trim()}T23:59:59.999Z`);
      }
      return val;
    },
    z.coerce.date().nullable().optional()
  ),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int('Sort order must be an integer').optional(),
});

export type CreateOfferInput = z.input<typeof CreateOfferInputSchema>;
export type UpdateOfferInput = z.input<typeof UpdateOfferInputSchema>;

