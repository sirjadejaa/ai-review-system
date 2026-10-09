'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './ai-review-assistant.module.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { LanguageCode, ReviewDraft } from '@/lib/ai/types';
import type { PredefinedFeedbackTag } from '@/lib/validation/feedback-schema';
import { generateReviewDraftsAction } from '@/lib/actions/ai-review-actions';
import { trackGoogleReviewClickAction } from '@/lib/actions/customer-actions';
import { isValidExternalUrl } from '@/lib/format/contact-links';
import { Check, ShieldCheck, Info, ExternalLink } from 'lucide-react';

export interface AIReviewAssistantProps {
  rating: number | null;
  selectedTags: PredefinedFeedbackTag[];
  customerNote: string;
  shopName?: string;
  googleReviewUrl?: string | null;
  source?: string;
}

const LANGUAGES: { code: LanguageCode; label: string; scriptHint: string }[] = [
  { code: 'en', label: 'English', scriptHint: 'Standard English' },
  { code: 'hi', label: 'हिंदी', scriptHint: 'Devanagari script' },
  { code: 'hinglish', label: 'Hinglish', scriptHint: 'Hindi in English letters' },
];

const DRAFT_STYLE_LABELS = ['Recommended', 'Short', 'Detailed'];

export const AIReviewAssistant: React.FC<AIReviewAssistantProps> = ({
  rating,
  selectedTags,
  customerNote,
  shopName = 'Pharmacy',
  googleReviewUrl,
  source,
}) => {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [editedReview, setEditedReview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTrackingGoogleClickRef = useRef(false);
  const activeRequestIdRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyRef = useRef('');
  const prevCustomerNoteRef = useRef(customerNote);

  const handleGoogleClick = useCallback(() => {
    if (isTrackingGoogleClickRef.current) return;
    isTrackingGoogleClickRef.current = true;
    void trackGoogleReviewClickAction(source).catch((err) => {
      console.error('Non-fatal: Google click tracking failed', err);
    });
    setTimeout(() => {
      isTrackingGoogleClickRef.current = false;
    }, 4000);
  }, [source]);

  // Live countdown timer for rate-limit cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const executeGeneration = useCallback((forceRetry = false) => {
    if (!rating) {
      setDrafts([]);
      setSelectedDraftId(null);
      setEditedReview('');
      setIsGenerating(false);
      setError(null);
      return;
    }

    const sortedTags = [...selectedTags].sort().join('|');
    const note = customerNote.trim().toLowerCase();
    const currentKey = `${rating}:${language}:${sortedTags}:${note}`;

    if (!forceRetry && lastKeyRef.current === currentKey && drafts.length === 3) {
      return;
    }
    lastKeyRef.current = currentKey;

    const currentRequestId = ++activeRequestIdRef.current;
    setIsGenerating(true);
    setError(null);

    generateReviewDraftsAction({
      rating,
      selectedTags,
      customerNote: customerNote.trim() || undefined,
      language,
      shopName,
    })
      .then((result) => {
        if (currentRequestId !== activeRequestIdRef.current) return;

        if (result.success && result.drafts && result.drafts.length === 3) {
          setDrafts(result.drafts);
          setSelectedDraftId(result.drafts[0].id);
          setEditedReview(result.drafts[0].text);
          setShowHandoffModal(false);
          setCooldownSeconds(0);
          setError(null);
        } else {
          lastKeyRef.current = '';
          if (result.isRateLimited && result.retryAfterSeconds) {
            setCooldownSeconds(result.retryAfterSeconds);
          }
          setError(
            result.error ||
              "We couldn't create suggestions right now. You can write your review manually below."
          );
        }
      })
      .catch(() => {
        if (currentRequestId !== activeRequestIdRef.current) return;
        lastKeyRef.current = '';
        setError(
          "We couldn't create suggestions right now. You can write your review manually below."
        );
      })
      .finally(() => {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsGenerating(false);
        }
      });
  }, [rating, selectedTags, customerNote, language, shopName, drafts.length]);

  // Automatic AI Generation: Triggers upon rating selection with adaptive debounce
  useEffect(() => {
    if (!rating) {
      setDrafts([]);
      setSelectedDraftId(null);
      setEditedReview('');
      setIsGenerating(false);
      setError(null);
      lastKeyRef.current = '';
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Adaptive debounce: 800ms when user is typing text note, 350ms for chip/rating clicks
    const isTyping = prevCustomerNoteRef.current !== customerNote;
    prevCustomerNoteRef.current = customerNote;
    const debounceMs = isTyping ? 800 : 350;

    debounceTimerRef.current = setTimeout(() => {
      executeGeneration(false);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rating, selectedTags, customerNote, language, executeGeneration]);

  const handleLanguageChange = (newLang: LanguageCode) => {
    if (newLang === language) return;
    setLanguage(newLang);
  };

  const handleSelectDraft = (draft: ReviewDraft) => {
    setSelectedDraftId(draft.id);
    setEditedReview(draft.text);
    setShowHandoffModal(false);
  };

  const handleCopyAndContinue = async () => {
    const textToCopy = editedReview.trim();
    if (!textToCopy) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand('copy');
      }
    } catch {
      if (textareaRef.current) {
        textareaRef.current.select();
      }
    }

    setShowHandoffModal(true);

    // Track analytics and trigger redirection
    if (googleReviewUrl && isValidExternalUrl(googleReviewUrl)) {
      handleGoogleClick();
      // Open Google Review in new tab
      try {
        window.open(googleReviewUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Fallback handled by the screen 6 button
      }
    }
  };

  // Only render if a rating is active
  if (!rating) {
    return null;
  }

  const hasValidGoogleUrl = Boolean(googleReviewUrl && isValidExternalUrl(googleReviewUrl));

  return (
    <div className={styles.container}>
      {/* Screen 4: Header */}
      <div className={styles.assistantHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title} style={{ fontFamily: 'var(--font-family-serif)', fontSize: '1.2rem', fontWeight: 600 }}>
            <span>Review Suggestions</span>
            <Badge variant="primary" size="sm">Natural Drafts</Badge>
          </h2>
          <p className={styles.subtitle}>
            We created a few natural suggestions based on your rating and feedback.
          </p>
        </div>
      </div>

      {/* Language Selector */}
      <div className={styles.languageSection}>
        <label className={styles.languageLabel}>Language</label>
        <div className={styles.languageGrid} role="radiogroup" aria-label="Review Language">
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                disabled={isGenerating}
                onClick={() => handleLanguageChange(lang.code)}
                className={`${styles.languageButton} ${isSelected ? styles.languageSelected : ''}`}
                title={lang.scriptHint}
              >
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen 3: Subtle Typographic / Healthcare Loading Treatment */}
      {isGenerating && (
        <div className={styles.loadingBanner} role="status">
          <span className={styles.loadingPulse} aria-hidden="true" />
          <span>Creating a natural suggestion for you…</span>
        </div>
      )}

      {/* Cooldown / Rate Limit Banner */}
      {cooldownSeconds > 0 && (
        <div className={styles.cooldownBanner} role="status">
          <div className={styles.cooldownHeader}>
            <span>Generation rate limit active</span>
            <span className={styles.cooldownBadge}>{cooldownSeconds}s</span>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', lineHeight: 'var(--line-height-normal)' }}>
            AI review suggestion capacity is briefly paused. You can wait {cooldownSeconds}s to retry or compose your review directly below.
          </p>
        </div>
      )}

      {/* Error Alert with Usable Retry */}
      {error && cooldownSeconds === 0 && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => executeGeneration(true)}
            disabled={isGenerating}
          >
            Retry Suggestions
          </button>
        </div>
      )}

      {/* Screen 4: 3 Distinct Editorial Cards (Recommended, Short, Detailed) */}
      {drafts.length === 3 && (
        <div className={styles.draftsContainer}>
          <span className={styles.draftsListLabel}>
            Tap a card to choose:
          </span>

          {drafts.map((draft, idx) => {
            const isSelected = selectedDraftId === draft.id;
            const styleLabel = DRAFT_STYLE_LABELS[idx] || `Draft ${idx + 1}`;
            return (
              <button
                key={draft.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectDraft(draft)}
                className={`${styles.draftCard} ${isSelected ? styles.draftSelected : ''}`}
              >
                <div className={styles.draftHeader}>
                  <span className={styles.draftOptionLabel}>{styleLabel}</span>
                  {isSelected && (
                    <Badge variant="primary" size="sm">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className={styles.draftText}>{draft.text}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Screen 5: Editorial Text Editor & Unified Copy Action */}
      <div className={styles.editorContainer}>
        <div className={styles.editorHeader}>
          <h3 className={styles.editorTitle}>
            {drafts.length > 0 ? 'Edit & Copy' : 'Write & Copy Review'}
          </h3>
          <span className={styles.editorSubtitle}>
            {editedReview.length} characters
          </span>
        </div>

        <Textarea
          ref={textareaRef}
          value={editedReview}
          onChange={(e) => {
            setEditedReview(e.target.value);
            setShowHandoffModal(false);
          }}
          maxLength={2000}
          rows={3}
          placeholder={
            drafts.length > 0
              ? 'Select an option above or write your honest review here...'
              : 'Write your honest review here...'
          }
          aria-label="Editable review text"
        />

        <div className={styles.actionRow}>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCopyAndContinue}
            disabled={!editedReview.trim() || isGenerating}
            style={{ minHeight: '52px', fontSize: '1rem', letterSpacing: '0.01em' }}
          >
            Copy &amp; Continue to Google
          </Button>
        </div>

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textAlign: 'center', margin: 'var(--space-1) 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}>
          <ShieldCheck size={14} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
          <span>Your personal information is not shared.</span>
        </p>

        {!hasValidGoogleUrl && (
          <div className={styles.googleUnavailableNotice} role="note">
            <Info size={16} aria-hidden="true" style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>
              Google Review link is not configured yet. Your review was copied to your clipboard.
            </span>
          </div>
        )}
      </div>

      {/* Screen 6: Premium Confirmation State / Google Handoff Modal */}
      {showHandoffModal && (
        <div className={styles.handoffModal} role="dialog" aria-modal="true" aria-labelledby="handoff-title">
          <div className={styles.handoffCard}>
            <div className={styles.handoffIcon} aria-hidden="true">
              <Check size={26} strokeWidth={2.5} />
            </div>
            <h3 id="handoff-title" className={styles.handoffTitle}>
              Review Copied
            </h3>
            <p className={styles.handoffMessage}>
              {hasValidGoogleUrl
                ? "You're all set. Redirecting you to Google Reviews…"
                : 'Your review is copied to your clipboard and ready to paste.'}
            </p>
            {hasValidGoogleUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', width: '100%', marginTop: 'var(--space-3)' }}>
                <a
                  href={googleReviewUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.handoffPrimaryBtn}
                >
                  <span>Continue to Google</span>
                  <ExternalLink size={16} aria-hidden="true" style={{ marginLeft: '6px' }} />
                </a>
                <a
                  href={googleReviewUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.handoffSecondaryLink}
                >
                  Not redirecting? Click here
                </a>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 'var(--space-2) 0 0' }}>
                Google Reviews page has not been configured by the pharmacy yet.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowHandoffModal(false)}
              className={styles.handoffCloseBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

AIReviewAssistant.displayName = 'AIReviewAssistant';
