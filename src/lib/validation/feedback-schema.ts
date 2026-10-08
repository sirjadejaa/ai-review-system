import { z } from 'zod';

export const FeedbackStatusSchema = z.enum(['NEW', 'REVIEWED', 'RESOLVED']);

/**
 * Predefined customer experience tags based on the approved product blueprint.
 * Arbitrary user-generated tags are strictly rejected to ensure clean data.
 */
export const PREDEFINED_FEEDBACK_TAGS = [
  'Quick Service',
  'Medicines in Stock',
  'Polite Staff',
  'Helpful Service',
  'Clean Store',
  'Good Prices',
] as const;

export type PredefinedFeedbackTag = (typeof PREDEFINED_FEEDBACK_TAGS)[number];

export const FeedbackTagSchema = z.enum(PREDEFINED_FEEDBACK_TAGS);

/**
 * Schema for general database repository feedback creation.
 */
export const CreateFeedbackInputSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  tags: z
    .array(z.string().trim().min(1, 'Tag cannot be empty'))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .nullable()
    .optional(),
  customerContact: z
    .string()
    .trim()
    .max(100, 'Customer contact cannot exceed 100 characters')
    .nullable()
    .optional(),
});

/**
 * Strict schema for public customer-facing feedback submission.
 * Enforces rating 1-5, predefined tag whitelist, and string limits.
 */
export const CustomerFeedbackSubmissionSchema = z.object({
  rating: z
    .number({ message: 'Please select a rating' })
    .int('Rating must be an integer')
    .min(1, 'Please select a rating between 1 and 5 stars')
    .max(5, 'Rating cannot exceed 5 stars'),
  tags: z
    .array(FeedbackTagSchema)
    .max(PREDEFINED_FEEDBACK_TAGS.length, 'Too many tags selected')
    .optional()
    .default([]),
  notes: z
    .string()
    .trim()
    .max(1000, 'Please keep your message shorter (maximum 1000 characters)')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  customerContact: z
    .string()
    .trim()
    .max(100, 'Please enter a valid contact number or leave it blank')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export const UpdateFeedbackStatusSchema = z.object({
  status: FeedbackStatusSchema,
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackInputSchema>;
export type CustomerFeedbackSubmissionInput = z.input<typeof CustomerFeedbackSubmissionSchema>;
export type UpdateFeedbackStatusInput = z.infer<typeof UpdateFeedbackStatusSchema>;
