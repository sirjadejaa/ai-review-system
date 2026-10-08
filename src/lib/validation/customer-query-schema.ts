import { z } from 'zod';

/**
 * Recognized and permitted QR scan source identifiers.
 * Prevents arbitrary query strings from polluting analytics.
 */
export const VALID_QR_SOURCES = ['qr', 'counter', 'table', 'card'] as const;
export type ValidQrSource = (typeof VALID_QR_SOURCES)[number];

export const CustomerLandingQuerySchema = z.object({
  source: z.enum(VALID_QR_SOURCES).optional(),
});

export type CustomerLandingQuery = z.infer<typeof CustomerLandingQuerySchema>;
