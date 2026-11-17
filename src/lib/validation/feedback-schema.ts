import { z } from 'zod';

export const FeedbackStatusSchema = z.enum(['NEW', 'REVIEWED', 'RESOLVED']);

export const UpdateFeedbackStatusSchema = z.object({
  status: FeedbackStatusSchema,
});

export type UpdateFeedbackStatusInput = z.infer<typeof UpdateFeedbackStatusSchema>;

/**
 * 13 Specific Restaurant & Café Customer Experience Tags.
 */
export const RESTAURANT_FEEDBACK_TAGS = [
  'Food Quality',
  'Taste',
  'Freshness',
  'Food Presentation',
  'Portion Size',
  'Menu Variety',
  'Price and Value',
  'Staff Behaviour',
  'Service Speed',
  'Restaurant Ambience',
  'Cleanliness',
  'Seating',
  'Overall Dining Experience',
] as const;

export const FASHION_FEEDBACK_TAGS = RESTAURANT_FEEDBACK_TAGS;

/**
 * Whitelist of all accepted feedback tags including legacy tags for backward compatibility.
 */
export const PREDEFINED_FEEDBACK_TAGS = [
  // Restaurant & Café tags
  'Food Quality',
  'Taste',
  'Freshness',
  'Food Presentation',
  'Portion Size',
  'Menu Variety',
  'Price and Value',
  'Staff Behaviour',
  'Service Speed',
  'Restaurant Ambience',
  'Cleanliness',
  'Seating',
  'Overall Dining Experience',
  // Boutique tags (backward compatibility)
  'Clothing Quality',
  'Fabric Quality',
  'Fitting & Sizing',
  'Design & Collection',
  'Comfort',
  'Pricing & Value',
  'Customer Service',
  'Store Ambience',
  'Variety & Availability',
  'Overall Shopping Experience',
  'Collection',
  'Shopping Experience',
  // Pharmacy & Legacy tags (backward compatibility)
  'Quick Service',
  'Medicines in Stock',
  'Polite Staff',
  'Helpful Staff',
  'Helpful Service',
  'Helpful Pharmacist',
  'Clean Store',
  'Good Prices',
  'Long Wait Time',
  'Waiting Time',
] as const;

export type PredefinedFeedbackTag = (typeof PREDEFINED_FEEDBACK_TAGS)[number];
export type RestaurantFeedbackTag = (typeof RESTAURANT_FEEDBACK_TAGS)[number];
export type FashionFeedbackTag = RestaurantFeedbackTag;

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
  tags: z.array(FeedbackTagSchema).default([]),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .nullable()
    .optional(),
  customerContact: z
    .string()
    .trim()
    .max(100, 'Contact information cannot exceed 100 characters')
    .nullable()
    .optional(),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackInputSchema>;

/**
 * Schema for customer feedback submission.
 */
export const CustomerFeedbackSubmissionSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
  tags: z.array(FeedbackTagSchema).optional().default([]),
  notes: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional()
    ),
  customerContact: z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
      z.string().trim().max(100, 'Contact information cannot exceed 100 characters').optional()
    ),
});

export type CustomerFeedbackSubmission = z.infer<typeof CustomerFeedbackSubmissionSchema>;
export type CustomerFeedbackSubmissionInput = z.input<typeof CustomerFeedbackSubmissionSchema>;
