import React from 'react';
import { generateThemeCss } from '@/lib/branding/theme';

export interface BrandThemeStyleProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

/**
 * Injects dynamic CSS variables for custom pharmacy branding.
 * Server rendered to eliminate Flash of Unstyled Content (FOUC).
 */
export const BrandThemeStyle: React.FC<BrandThemeStyleProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const css = generateThemeCss(primaryColor, secondaryColor, accentColor);
  return (
    <style
      id="pharmacy-brand-theme"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
};
