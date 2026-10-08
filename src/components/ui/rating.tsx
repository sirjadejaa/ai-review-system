'use client';

import React, { useState } from 'react';
import styles from './rating.module.css';

export interface RatingProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  isReadOnly?: boolean;
  disabled?: boolean;
  onChange?: (val: number) => void;
  className?: string;
  label?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value = 0,
  max = 5,
  size = 'md',
  isReadOnly = false,
  disabled = false,
  onChange,
  className = '',
  label,
}) => {
  const [hoverVal, setHoverVal] = useState<number | null>(null);

  const activeValue = hoverVal !== null ? hoverVal : value;

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (isReadOnly || disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(max, value + 1);
      onChange?.(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, value - 1);
      onChange?.(prev);
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      const num = parseInt(e.key, 10);
      if (num <= max) {
        onChange?.(num);
      }
    }
  };

  return (
    <div
      role={isReadOnly ? 'img' : 'radiogroup'}
      aria-label={label || `${value} out of ${max} stars`}
      className={`${styles.ratingGroup} ${styles[size]} ${className}`}
      onMouseLeave={() => !isReadOnly && setHoverVal(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= activeValue;

        if (isReadOnly) {
          return (
            <span
              key={starIndex}
              className={`${styles.starButton} ${styles.readOnly} ${isFilled ? styles.active : ''}`}
              aria-hidden="true"
            >
              <StarIcon isFilled={isFilled} className={styles.starIcon} />
            </span>
          );
        }

        return (
          <button
            key={starIndex}
            type="button"
            role="radio"
            aria-checked={value === starIndex}
            aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
            tabIndex={disabled ? -1 : (value === starIndex || (value === 0 && starIndex === 1) ? 0 : -1)}
            disabled={disabled}
            className={`${styles.starButton} ${isFilled ? styles.active : ''}`}
            onClick={() => onChange?.(starIndex)}
            onMouseEnter={() => setHoverVal(starIndex)}
            onKeyDown={(e) => handleKeyDown(e, starIndex)}
          >
            <StarIcon isFilled={isFilled} className={styles.starIcon} />
          </button>
        );
      })}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};

const StarIcon = ({ isFilled, className }: { isFilled: boolean; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill={isFilled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

Rating.displayName = 'Rating';
