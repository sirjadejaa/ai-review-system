'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './feedback-form.module.css';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  PREDEFINED_FEEDBACK_TAGS,
  type PredefinedFeedbackTag,
} from '@/lib/validation/feedback-schema';
import { submitCustomerFeedbackAction } from '@/lib/actions/feedback-actions';
import { AIReviewAssistant } from './ai-review-assistant';
import { PharmacyLogo } from '@/components/brand/pharmacy-logo';
import { Check, Plus, ShieldCheck, ArrowLeft } from 'lucide-react';

const RATING_LABELS: Record<number, string> = {
  1: '1 Star — Needs Improvement',
  2: '2 Stars — Fair Experience',
  3: '3 Stars — Good Experience',
  4: '4 Stars — Very Good Experience',
  5: '5 Stars — Excellent Experience',
};

export interface FeedbackFormProps {
  shopName?: string;
  logoUrl?: string | null;
  googleReviewUrl?: string | null;
  source?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  shopName = 'Arogya Pharmacy',
  logoUrl,
  googleReviewUrl,
  source,
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<PredefinedFeedbackTag[]>([]);
  const [notes, setNotes] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    rating?: string;
    notes?: string;
    customerContact?: string;
  }>({});

  const handleRatingChange = (val: number) => {
    setRating(val);
    setFieldErrors((prev) => ({ ...prev, rating: undefined }));
    setGeneralError(null);
  };

  const handleTagToggle = (tag: PredefinedFeedbackTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      setFieldErrors((prev) => ({ ...prev, rating: 'Please select a rating' }));
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const result = await submitCustomerFeedbackAction({
        rating,
        tags: selectedTags,
        notes: notes.trim() || undefined,
        customerContact: customerContact.trim() || undefined,
      });

      if (result.success) {
        setIsSubmitted(true);
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setGeneralError(result.message || "We couldn't submit your feedback right now. Please try again.");
      }
    } catch {
      setGeneralError("We couldn't submit your feedback right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Confirmation View
  if (isSubmitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon} aria-hidden="true">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <Badge variant="success" size="md">
            Feedback Received
          </Badge>
          <h1 className={styles.successTitle}>Thank you for your feedback!</h1>
          <p className={styles.successMessage}>
            We appreciate you taking the time to share your experience with {shopName}.
            Your feedback helps us continuously improve our patient care and service.
          </p>
          <div className={styles.successActions}>
            <Link
              href={source ? `/?source=${source}` : '/'}
              style={{ textDecoration: 'none', width: '100%' }}
            >
              <Button variant="primary" size="lg" fullWidth>
                Back to Pharmacy Home
              </Button>
            </Link>
            <Link
              href={source ? `/customer/card?source=${source}` : '/customer/card'}
              style={{ textDecoration: 'none', width: '100%' }}
            >
              <Button variant="outline" size="lg" fullWidth>
                View Digital Pharmacy Card
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Feedback Form View
  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-2)' }}>
        <Link href={source ? `/?source=${encodeURIComponent(source)}` : '/'} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" style={{ marginRight: 'var(--space-1)' }} />
          <span>Return to Home</span>
        </Link>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${shopName} logo`}
            style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
          />
        ) : (
          <PharmacyLogo size="sm" variant="mark" />
        )}
      </div>

      <section className={styles.headerSection}>
        <div style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 600 }}>
          {shopName}
        </div>
        <h1 className="editorial-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          How was your experience?
        </h1>
        <p className={styles.pageDescription} style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          Your feedback helps us serve you better.
        </p>
      </section>

      <form onSubmit={handleSubmit} className={styles.formCard} noValidate>
        {generalError && (
          <div className={styles.generalError} role="alert">
            {generalError}
          </div>
        )}

        {/* 1. Star Rating Section (Mandatory) */}
        <fieldset className={styles.section} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className={styles.sectionTitle}>
            <span>Select Your Rating</span>
            <span style={{ color: 'var(--color-danger)' }} aria-hidden="true">*</span>
          </legend>
          <div className={styles.ratingContainer}>
            <Rating
              value={rating ?? 0}
              size="lg"
              onChange={handleRatingChange}
              label={rating ? `${rating} of 5 stars` : 'Rate from 1 to 5 stars'}
            />
            <span className={styles.ratingHint}>
              {rating ? RATING_LABELS[rating] : 'Tap a star to rate'}
            </span>
          </div>
          {fieldErrors.rating && (
            <p className={styles.ratingError} role="alert">
              {fieldErrors.rating}
            </p>
          )}
        </fieldset>

        {/* 2. Experience Tags Section (Optional) */}
        <fieldset className={styles.section} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className={styles.sectionTitle}>
            <span>What went well?</span>
            <span className={styles.sectionSubtitle}>(Optional)</span>
          </legend>
          <div className={styles.tagGrid} role="group" aria-label="Experience Highlights">
            {PREDEFINED_FEEDBACK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleTagToggle(tag)}
                  className={`${styles.tagButton} ${isSelected ? styles.tagSelected : ''}`}
                >
                  {isSelected ? (
                    <Check size={14} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <Plus size={14} aria-hidden="true" style={{ opacity: 0.6 }} />
                  )}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* 3. Customer Notes Section (Optional) */}
        <div className={styles.section}>
          <Textarea
            label="Anything else you'd like to share? (Optional)"
            placeholder="Tell us about your experience with our staff, medicines, or service..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={3}
            error={fieldErrors.notes}
            helpText="Please avoid sharing personal medical history or prescription details."
          />
          <div className={styles.charCount}>
            <span>{notes.length} / 1000</span>
          </div>
        </div>

        {/* Medical Privacy Guidance Callout */}
        <div className={styles.privacyNotice} role="note">
          <ShieldCheck size={16} aria-hidden="true" style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Privacy Note:</strong> Please avoid sharing sensitive medical history, doctor prescriptions, or health conditions.
          </span>
        </div>

        {/* 4. AI Review Assistant (Integrated) */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
          <AIReviewAssistant
            rating={rating}
            selectedTags={selectedTags}
            customerNote={notes}
            shopName={shopName}
            googleReviewUrl={googleReviewUrl}
            source={source}
          />
        </div>

        {/* 5. Optional Direct Pharmacy Feedback Submission */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Send Private Feedback to Store Owner
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Optional: Submit your response directly to the pharmacy management.
            </p>
          </div>

          <Input
            label="Phone number for follow-up (Optional)"
            placeholder="e.g. 98765 43210"
            type="tel"
            value={customerContact}
            onChange={(e) => setCustomerContact(e.target.value)}
            maxLength={100}
            error={fieldErrors.customerContact}
            helpText="Optional: Provide a number only if you would like the store owner to follow up."
          />

          <Button
            type="submit"
            variant="outline"
            size="lg"
            fullWidth
            disabled={!rating || isSubmitting}
            isLoading={isSubmitting}
          >
            Submit Private Feedback
          </Button>
        </div>
      </form>
    </div>
  );
};

FeedbackForm.displayName = 'FeedbackForm';
