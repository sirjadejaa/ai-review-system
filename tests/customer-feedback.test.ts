import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  PREDEFINED_FEEDBACK_TAGS,
  CustomerFeedbackSubmissionSchema,
} from '@/lib/validation/feedback-schema';
import { submitCustomerFeedbackAction } from '@/lib/actions/feedback-actions';
import {
  isFeedbackRateLimited,
  recordFeedbackSubmission,
  clearFeedbackRateLimits,
} from '@/lib/feedback/rate-limiter';

describe('Phase 5: Customer Rating & Feedback Engine Tests', () => {
  beforeEach(() => {
    clearFeedbackRateLimits();
  });

  describe('1. Rating Validation & Boundaries', () => {
    it('accepts 1 star (minimum valid rating)', () => {
      const result = CustomerFeedbackSubmissionSchema.safeParse({ rating: 1 });
      expect(result.success).toBe(true);
    });

    it('accepts 5 stars (maximum valid rating)', () => {
      const result = CustomerFeedbackSubmissionSchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    it('rejects ratings below 1 (e.g. 0 or negative numbers)', () => {
      const resultZero = CustomerFeedbackSubmissionSchema.safeParse({ rating: 0 });
      expect(resultZero.success).toBe(false);

      const resultNeg = CustomerFeedbackSubmissionSchema.safeParse({ rating: -1 });
      expect(resultNeg.success).toBe(false);
    });

    it('rejects ratings above 5 (e.g. 6, 10)', () => {
      const resultSix = CustomerFeedbackSubmissionSchema.safeParse({ rating: 6 });
      expect(resultSix.success).toBe(false);

      const resultTen = CustomerFeedbackSubmissionSchema.safeParse({ rating: 10 });
      expect(resultTen.success).toBe(false);
    });

    it('rejects non-integer, NaN, null, or missing ratings', () => {
      expect(CustomerFeedbackSubmissionSchema.safeParse({ rating: 4.5 }).success).toBe(false);
      expect(CustomerFeedbackSubmissionSchema.safeParse({ rating: NaN }).success).toBe(false);
      expect(CustomerFeedbackSubmissionSchema.safeParse({ rating: null }).success).toBe(false);
      expect(CustomerFeedbackSubmissionSchema.safeParse({}).success).toBe(false);
      expect(CustomerFeedbackSubmissionSchema.safeParse({ rating: '5' }).success).toBe(false);
    });
  });

  describe('2. Experience Tag Whitelisting', () => {
    it('accepts predefined allowed tags', () => {
      PREDEFINED_FEEDBACK_TAGS.forEach((tag) => {
        const result = CustomerFeedbackSubmissionSchema.safeParse({
          rating: 5,
          tags: [tag],
        });
        expect(result.success).toBe(true);
      });
    });

    it('accepts multiple valid tags simultaneously', () => {
      const result = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 4,
        tags: ['Quick Service', 'Medicines in Stock', 'Polite Staff'],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toHaveLength(3);
      }
    });

    it('accepts zero tags (empty array)', () => {
      const result = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        tags: [],
      });
      expect(result.success).toBe(true);
    });

    it('strictly rejects unknown, arbitrary, or malicious tags', () => {
      const malicious = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        tags: ['Hacked Tag<script>'],
      });
      expect(malicious.success).toBe(false);

      const unapproved = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        tags: ['Cheap Goods', 'Quick Service'],
      });
      expect(unapproved.success).toBe(false);
    });
  });

  describe('3. Customer Notes Sanitization & Length Limits', () => {
    it('allows omitting customer note', () => {
      const result = CustomerFeedbackSubmissionSchema.safeParse({ rating: 4 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('trims whitespace and handles empty strings cleanly', () => {
      const result = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 4,
        notes: '   Helpful pharmacy staff   ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('Helpful pharmacy staff');
      }

      const emptyResult = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 4,
        notes: '    ',
      });
      expect(emptyResult.success).toBe(true);
      if (emptyResult.success) {
        expect(emptyResult.data.notes).toBeUndefined();
      }
    });

    it('enforces maximum note length (1000 characters)', () => {
      const note1000 = 'a'.repeat(1000);
      const note1001 = 'a'.repeat(1001);

      expect(
        CustomerFeedbackSubmissionSchema.safeParse({ rating: 5, notes: note1000 }).success
      ).toBe(true);
      expect(
        CustomerFeedbackSubmissionSchema.safeParse({ rating: 5, notes: note1001 }).success
      ).toBe(false);
    });

    it('treats HTML tags as plain text strings without stripping or execution', () => {
      const scriptPayload = '<script>alert("xss")</script>';
      const result = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        notes: scriptPayload,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe(scriptPayload);
      }
    });
  });

  describe('4. Customer Contact Validation & Privacy', () => {
    it('allows voluntary contact or leaving it blank', () => {
      const withoutContact = CustomerFeedbackSubmissionSchema.safeParse({ rating: 5 });
      expect(withoutContact.success).toBe(true);

      const withContact = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        customerContact: '+91 98765 43210',
      });
      expect(withContact.success).toBe(true);
    });

    it('rejects contact numbers exceeding 100 characters', () => {
      const tooLong = '9'.repeat(101);
      const result = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        customerContact: tooLong,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('5. Database Lifecycle & Status Boundary', () => {
    it('persists feedback via server action and strictly forces status to NEW', async () => {
      const uniqueNote = `Unit test submission ${Date.now()}`;
      const result = await submitCustomerFeedbackAction({
        rating: 5,
        tags: ['Quick Service', 'Clean Store'],
        notes: uniqueNote,
        customerContact: '9876543210',
      });

      expect(result.success).toBe(true);

      // Verify directly in database
      const created = await prisma.feedback.findFirst({
        where: { notes: uniqueNote },
      });

      expect(created).toBeDefined();
      expect(created?.rating).toBe(5);
      expect(created?.status).toBe('NEW');
      expect(JSON.parse(created?.tags || '[]')).toEqual(['Quick Service', 'Clean Store']);

      // Cleanup test record
      if (created) {
        await prisma.feedback.delete({ where: { id: created.id } });
      }
    });

    it('does not allow client to dictate or override status to REVIEWED or RESOLVED', () => {
      // CustomerFeedbackSubmissionSchema has no status field
      const parsed = CustomerFeedbackSubmissionSchema.safeParse({
        rating: 5,
        status: 'RESOLVED',
      });
      expect(parsed.success).toBe(true);
      // Extra fields stripped by Zod
      expect((parsed as { data: Record<string, unknown> }).data.status).toBeUndefined();
    });

    it('preserves medical privacy: zero health, prescription, or diagnostic fields in model', async () => {
      const uniqueNote = `Privacy check note ${Date.now()}`;
      const result = await submitCustomerFeedbackAction({
        rating: 4,
        notes: uniqueNote,
      });
      expect(result.success).toBe(true);

      const created = await prisma.feedback.findFirst({
        where: { notes: uniqueNote },
      });

      expect(created).toBeDefined();
      const keys = Object.keys(created!);

      // Confirm only allowed fields exist
      expect(keys).toEqual([
        'id',
        'rating',
        'tags',
        'notes',
        'customerContact',
        'status',
        'createdAt',
        'updatedAt',
      ]);

      // Confirm absence of invasive fields
      expect(keys).not.toContain('ipAddress');
      expect(keys).not.toContain('gps');
      expect(keys).not.toContain('prescription');
      expect(keys).not.toContain('medicalHistory');

      // Cleanup
      if (created) {
        await prisma.feedback.delete({ where: { id: created.id } });
      }
    });
  });

  describe('6. Abuse Prevention & In-Memory Rate Limiting', () => {
    it('throttles client after 5 submissions within the 10-minute window', () => {
      const clientKey = 'test-client-123';

      for (let i = 0; i < 5; i++) {
        expect(isFeedbackRateLimited(clientKey).isBlocked).toBe(false);
        recordFeedbackSubmission(clientKey);
      }

      // 6th attempt should be blocked
      const blocked = isFeedbackRateLimited(clientKey);
      expect(blocked.isBlocked).toBe(true);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('resets rate limits cleanly when clearFeedbackRateLimits is called', () => {
      const clientKey = 'test-client-456';
      for (let i = 0; i < 5; i++) {
        recordFeedbackSubmission(clientKey);
      }
      expect(isFeedbackRateLimited(clientKey).isBlocked).toBe(true);

      clearFeedbackRateLimits();
      expect(isFeedbackRateLimited(clientKey).isBlocked).toBe(false);
    });
  });
});
