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
  FASHION_FEEDBACK_TAGS,
  type PredefinedFeedbackTag,
} from '@/lib/validation/feedback-schema';
import { submitCustomerFeedbackAction } from '@/lib/actions/feedback-actions';
import { AIReviewAssistant } from './ai-review-assistant';
import { BoutiqueLogo } from '@/components/brand/boutique-logo';
import { AnimatedRatingBackground } from './animated-rating-background';
import { useLanguage } from '@/lib/i18n/context';
import { Check, Plus, ArrowLeft } from 'lucide-react';

export interface FeedbackFormProps {
  shopName?: string;
  logoUrl?: string | null;
  googleReviewUrl?: string | null;
  source?: string;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  shopName = 'Maison & Thread',
  logoUrl,
  googleReviewUrl,
  source,
}) => {
  const { t, language, tagTranslations } = useLanguage();
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

  const getRatingHint = (r: number | null) => {
    if (!r) return t.ratingHintDefault;
    switch (r) {
      case 1:
        return t.rating1;
      case 2:
        return t.rating2;
      case 3:
        return t.rating3;
      case 4:
        return t.rating4;
      case 5:
        return t.rating5;
      default:
        return t.ratingHintDefault;
    }
  };

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
      setFieldErrors((prev) => ({ ...prev, rating: t.selectRatingError }));
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
          <h1 className={styles.successTitle}>{t.thankYouTitle}</h1>
          <p className={styles.successMessage}>
            {t.thankYouMessage}
          </p>
          <div className={styles.successActions}>
            <Link
              href={source ? `/?source=${source}` : '/'}
              style={{ textDecoration: 'none', width: '100%' }}
            >
              <Button variant="primary" size="lg" fullWidth>
                {t.backToHome}
              </Button>
            </Link>
            <Link
              href={source ? `/customer/card?source=${source}` : '/customer/card'}
              style={{ textDecoration: 'none', width: '100%' }}
            >
              <Button variant="outline" size="lg" fullWidth>
                {t.viewPrivilegeCardCta}
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
          <span>{t.backToHome}</span>
        </Link>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${shopName} logo`}
            style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
          />
        ) : (
          <BoutiqueLogo size="sm" variant="mark" shopName={shopName} />
        )}
      </div>

      <section className={styles.headerSection}>
        <div style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', fontWeight: 600 }}>
          {shopName}
        </div>
        <h1 className="editorial-title" style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          {t.ratingHeading}
        </h1>
        <p className={styles.pageDescription} style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          {t.ratingSubtitle}
        </p>
      </section>

      <form onSubmit={handleSubmit} className={styles.formCard} noValidate>
        {generalError && (
          <div className={styles.generalError} role="alert">
            {generalError}
          </div>
        )}

        {/* 1. Star Rating Section with Animated Rating Background */}
        <fieldset className={styles.section} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className={styles.sectionTitle}>
            <span>{t.ratingLabel}</span>
            <span style={{ color: 'var(--color-danger)' }} aria-hidden="true">*</span>
          </legend>
          <div className={styles.ratingContainer}>
            <AnimatedRatingBackground currentRating={rating ?? 0} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Rating
                value={rating ?? 0}
                size="lg"
                onChange={handleRatingChange}
                label={rating ? `${rating} of 5 stars` : 'Rate from 1 to 5 stars'}
              />
              <span className={styles.ratingHint}>
                {getRatingHint(rating)}
              </span>
            </div>
          </div>
          {fieldErrors.rating && (
            <p className={styles.ratingError} role="alert">
              {fieldErrors.rating}
            </p>
          )}
        </fieldset>

        {/* 2. Fashion Experience Tags Section (Multilingual Gujarati/Gujlish/English) */}
        <fieldset className={styles.section} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className={styles.sectionTitle}>
            <span>{t.highlightsLabel}</span>
            <span className={styles.sectionSubtitle}>({t.highlightsSubtitle})</span>
          </legend>
          <div className={styles.tagGrid} role="group" aria-label="Fashion Experience Highlights">
            {tagTranslations.map((tag) => {
              const tagKey = tag.id as PredefinedFeedbackTag;
              const isSelected = selectedTags.includes(tagKey);
              const tagLabel = tag[language] || tag.en;
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleTagToggle(tagKey)}
                  className={`${styles.tagButton} ${isSelected ? styles.tagSelected : ''}`}
                >
                  {isSelected ? (
                    <Check size={14} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <Plus size={14} aria-hidden="true" style={{ opacity: 0.6 }} />
                  )}
                  <span>{tagLabel}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* 3. Customer Notes Section (Optional) */}
        <div className={styles.section}>
          <Textarea
            label={t.notesLabel}
            placeholder={t.notesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            rows={3}
            error={fieldErrors.notes}
            helpText={t.privacyNotice}
          />
          <div className={styles.charCount}>
            <span>{notes.length} / 1000 {t.charCount}</span>
          </div>
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

        {/* 5. Optional Direct Boutique Owner Feedback Submission */}
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
              {t.submitPrivateFeedback}
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              {t.privacyNotice}
            </p>
          </div>

          <Input
            label={t.contactOptionalLabel}
            placeholder={t.contactPlaceholder}
            type="tel"
            value={customerContact}
            onChange={(e) => setCustomerContact(e.target.value)}
            maxLength={100}
            error={fieldErrors.customerContact}
          />

          <Button
            type="submit"
            variant="outline"
            size="lg"
            fullWidth
            disabled={!rating || isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? t.submitting : t.submitPrivateFeedback}
          </Button>
        </div>
      </form>
    </div>
  );
};

FeedbackForm.displayName = 'FeedbackForm';
