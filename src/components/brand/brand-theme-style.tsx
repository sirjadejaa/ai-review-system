import React from 'react';
import { generateThemeCss, type ThemeColorOptions } from '@/lib/branding/theme';

export interface BrandThemeStyleProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

/**
 * Server component that injects dynamic CSS custom properties for brand colors.
 * Ensures custom colors configured by the boutique admin in settings are immediately
 * applied across the layout without requiring code rebuilding.
 */
export const BrandThemeStyle: React.FC<BrandThemeStyleProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const css = generateThemeCss({
    primaryColor,
    secondaryColor,
    accentColor,
  });

  return (
    <style
      id="boutique-brand-theme"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
};

export default BrandThemeStyle;
