'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type SupportedLanguage,
  LANGUAGE_OPTIONS,
  getTranslation,
  type TagTranslation,
  FASHION_TAG_TRANSLATIONS,
} from './translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: ReturnType<typeof getTranslation>;
  tagTranslations: TagTranslation[];
  getTagLabel: (tagId: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'boutique_customer_lang';

export function LanguageProvider({
  children,
  initialLanguage = 'en',
}: {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
}) {
  const [language, setLanguageState] = useState<SupportedLanguage>(initialLanguage);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'en' || stored === 'gujlish' || stored === 'hinglish')) {
        setLanguageState(stored as SupportedLanguage);
      }
    } catch {
      // sessionStorage might not be accessible
    }
  }, []);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      sessionStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore sessionStorage issues
    }
  };

  const t = getTranslation(language);

  const getTagLabel = (tagId: string): string => {
    const item = FASHION_TAG_TRANSLATIONS.find(
      (t) => t.id.toLowerCase() === tagId.toLowerCase() || t.en.toLowerCase() === tagId.toLowerCase()
    );
    if (!item) return tagId;
    return item[language] || item.en;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tagTranslations: FASHION_TAG_TRANSLATIONS,
        getTagLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return default fallback when used outside provider
    return {
      language: 'en' as SupportedLanguage,
      setLanguage: () => {},
      t: getTranslation('en'),
      tagTranslations: FASHION_TAG_TRANSLATIONS,
      getTagLabel: (tagId: string) => tagId,
    };
  }
  return context;
}
