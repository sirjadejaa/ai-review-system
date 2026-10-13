/**
 * Centralized Healthcare Branding & Dynamic Color Palette Generator
 * Single Medical Shop / Pharmacy AI Review & Digital Customer Card System
 */

export interface HealthcareColorPreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const HEALTHCARE_COLOR_PRESETS: HealthcareColorPreset[] = [
  {
    id: 'arogya_forest',
    name: 'Arogya Forest (Default)',
    description: 'Deep Forest Green, Muted Sage, and Botanical Mint. Clinical authority & natural healing.',
    primary: '#123e35',
    secondary: '#4a6b61',
    accent: '#92bfa9',
  },
  {
    id: 'classic_apothecary',
    name: 'Classic Apothecary',
    description: 'Apothecary Dark Pine, Herbal Sage, and Warm Gold. Traditional pharmaceutical heritage.',
    primary: '#1e3a2f',
    secondary: '#3d5a4c',
    accent: '#c2a649',
  },
  {
    id: 'modern_teal',
    name: 'Modern Clinical Teal',
    description: 'Deep Medical Teal, Slate Ocean, and Soft Cyan. Clean contemporary healthcare.',
    primary: '#0f4c5c',
    secondary: '#3b7a8c',
    accent: '#7bc4c4',
  },
  {
    id: 'care_emerald',
    name: 'Care Emerald',
    description: 'Emerald Care, Pine Green, and Fresh Mint. Vibrant, approachable wellness.',
    primary: '#164e43',
    secondary: '#2d6a5d',
    accent: '#52b788',
  },
  {
    id: 'royal_navy',
    name: 'Royal Navy Healthcare',
    description: 'Midnight Navy, Slate Indigo, and Soft Sky Blue. Premium, institutional trust.',
    primary: '#172a45',
    secondary: '#31486b',
    accent: '#6d94c7',
  },
];

export const DEFAULT_PRIMARY_COLOR = '#123e35';
export const DEFAULT_SECONDARY_COLOR = '#4a6b61';
export const DEFAULT_ACCENT_COLOR = '#92bfa9';

/**
 * Parses a hex color string (#rgb or #rrggbb) into numeric RGB components.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.trim().replace(/^#/, '');

  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }

  return null;
}

/**
 * Adjusts color brightness: positive percent brightens, negative percent darkens (-100 to 100).
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const adjust = (val: number) => {
    if (factor > 0) {
      return Math.min(255, Math.round(val + (255 - val) * factor));
    } else {
      return Math.max(0, Math.round(val + val * factor));
    }
  };

  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Blends hex color towards pure white or returns rgba string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(18, 62, 53, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export interface ThemeColorOptions {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

/**
 * Generates dynamic CSS :root variables for brand colors.
 * Accepts either an options object or positional arguments for flexibility.
 */
export function generateThemeCss(
  primaryOrOptions?: string | ThemeColorOptions | null,
  secondaryColorArg?: string | null,
  accentColorArg?: string | null
): string {
  let primaryInput: string | null | undefined;
  let secondaryInput: string | null | undefined;
  let accentInput: string | null | undefined;

  if (primaryOrOptions && typeof primaryOrOptions === 'object') {
    primaryInput = primaryOrOptions.primaryColor;
    secondaryInput = primaryOrOptions.secondaryColor;
    accentInput = primaryOrOptions.accentColor;
  } else {
    primaryInput = primaryOrOptions;
    secondaryInput = secondaryColorArg;
    accentInput = accentColorArg;
  }

  const primary = (primaryInput && hexToRgb(primaryInput) ? primaryInput : DEFAULT_PRIMARY_COLOR).toLowerCase();
  const secondary = (secondaryInput && hexToRgb(secondaryInput) ? secondaryInput : DEFAULT_SECONDARY_COLOR).toLowerCase();
  const accent = (accentInput && hexToRgb(accentInput) ? accentInput : DEFAULT_ACCENT_COLOR).toLowerCase();

  const primaryRgb = hexToRgb(primary) || { r: 18, g: 62, b: 53 };
  const primaryHover = adjustBrightness(primary, -15);
  const primaryActive = adjustBrightness(primary, -28);
  const primarySubtle = hexToRgba(primary, 0.08);
  const primaryBorder = hexToRgba(primary, 0.25);
  const primaryText = adjustBrightness(primary, -10);

  const secondaryHover = adjustBrightness(secondary, -15);
  const secondarySubtle = hexToRgba(secondary, 0.08);
  const secondaryText = adjustBrightness(secondary, -10);

  const accentSubtle = hexToRgba(accent, 0.12);
  const accentText = adjustBrightness(accent, -35);

  return `:root {
  --color-primary: ${primary};
  --color-primary-rgb: ${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b};
  --color-primary-hover: ${primaryHover};
  --color-primary-active: ${primaryActive};
  --color-primary-subtle: ${primarySubtle};
  --color-primary-border: ${primaryBorder};
  --color-primary-text: ${primaryText};
  --color-secondary: ${secondary};
  --color-secondary-hover: ${secondaryHover};
  --color-secondary-subtle: ${secondarySubtle};
  --color-secondary-text: ${secondaryText};
  --color-accent: ${accent};
  --color-accent-subtle: ${accentSubtle};
  --color-accent-text: ${accentText};
}`;
}
