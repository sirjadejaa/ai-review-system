/**
 * Centralized Boutique Branding & Dynamic Color Palette Generator
 * Premium Clothing Store / Fashion Boutique AI Review & Digital Customer Card System
 */

export interface BoutiqueColorPreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const BOUTIQUE_COLOR_PRESETS: BoutiqueColorPreset[] = [
  {
    id: 'noir_atelier_gold',
    name: 'Noir & Atelier Gold (Default)',
    description: 'Luxury Noir, Tailored Charcoal, and Warm Champagne Gold. Editorial high-fashion aesthetic.',
    primary: '#171717',
    secondary: '#3a3a3a',
    accent: '#a88b64',
  },
  {
    id: 'cashmere_sand',
    name: 'Cashmere & Sand',
    description: 'Warm Espresso, Soft Cashmere, and Sandstone Beige. Relaxed luxury & minimalist chic.',
    primary: '#2b2621',
    secondary: '#544b43',
    accent: '#c2a68c',
  },
  {
    id: 'midnight_silk',
    name: 'Midnight & Silk',
    description: 'Deep Midnight Navy, Slate Steel, and Silk Ice Blue. Modern eveningwear & refined tailoring.',
    primary: '#161b26',
    secondary: '#323b4e',
    accent: '#8b9eb7',
  },
  {
    id: 'atelier_olive',
    name: 'Atelier Olive',
    description: 'Rich Botanical Olive, Earth Sage, and Burnished Brass. Sustainable couture & heritage fabrics.',
    primary: '#1c2419',
    secondary: '#3b4535',
    accent: '#9a8758',
  },
];

export const DEFAULT_PRIMARY_COLOR = '#171717';
export const DEFAULT_SECONDARY_COLOR = '#3a3a3a';
export const DEFAULT_ACCENT_COLOR = '#a88b64';

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
  if (!rgb) return `rgba(23, 23, 23, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export interface ThemeColorOptions {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

/**
 * Generates dynamic CSS :root variables for boutique brand colors.
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

  const primaryRgb = hexToRgb(primary) || { r: 23, g: 23, b: 23 };
  const primaryHover = adjustBrightness(primary, -15);
  const primaryActive = adjustBrightness(primary, -28);
  const primarySubtle = hexToRgba(primary, 0.06);
  const primaryBorder = hexToRgba(primary, 0.2);
  const primaryText = adjustBrightness(primary, -10);

  const secondaryHover = adjustBrightness(secondary, -15);
  const secondarySubtle = hexToRgba(secondary, 0.06);
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
