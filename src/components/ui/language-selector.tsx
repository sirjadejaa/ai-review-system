'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '@/lib/i18n/translations';
import styles from './language-selector.module.css';

export interface LanguageSelectorProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`${styles.selectorContainer} ${className || ''}`}
      role="radiogroup"
      aria-label="Language selection"
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`${styles.pillButton} ${isActive ? styles.pillActive : ''}`}
            onClick={() => setLanguage(option.code as SupportedLanguage)}
          >
            {option.nativeLabel}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSelector;
