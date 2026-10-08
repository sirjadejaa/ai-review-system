/**
 * Utilities for customer contact action formatting and sanitization.
 */

/**
 * Formats a phone number for an RFC 3966 `tel:` URI.
 * Preserves a leading '+' if present and removes all whitespace, hyphens, and brackets.
 * Returns empty string if no valid digits are found.
 */
export function formatTelHref(phone: string | null | undefined): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return hasPlus ? `tel:+${digits}` : `tel:${digits}`;
}

/**
 * Formats a WhatsApp number for an official `https://wa.me/<number>` click-to-chat URL.
 * WhatsApp requires purely numeric digits without '+', '-', or spaces.
 * For 10-digit Indian numbers without country code, prepends country code '91'.
 * Returns empty string if no valid digits are found.
 */
export function formatWhatsAppHref(whatsapp: string | null | undefined): string {
  if (!whatsapp) return '';
  const digits = whatsapp.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return `https://wa.me/91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `https://wa.me/91${digits.slice(1)}`;
  }
  return `https://wa.me/${digits}`;
}

/**
 * Validates whether an external URL is a safe HTTP/HTTPS link.
 * Rejects empty values, non-http(s) schemes, and malformed URLs.
 */
export function isValidExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
