import { describe, it, expect } from 'vitest';

interface ParsedSocialLink {
  platform: 'instagram' | 'facebook' | 'whatsapp' | 'youtube' | 'pinterest' | 'website';
  url: string;
  label: string;
}

function detectPlatform(urlStr: string): ParsedSocialLink | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  const trimmed = urlStr.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.isEnabled === false || !parsed.url) return null;
      return {
        platform: parsed.platform || 'website',
        url: parsed.url,
        label: parsed.label || parsed.platform || 'Social Link',
      };
    }

    const lower = trimmed.toLowerCase();
    if (lower.includes('instagram.com')) {
      return { platform: 'instagram', url: trimmed, label: 'Instagram' };
    }
    if (lower.includes('facebook.com') || lower.includes('fb.com')) {
      return { platform: 'facebook', url: trimmed, label: 'Facebook' };
    }
    if (lower.includes('wa.me') || lower.includes('whatsapp.com')) {
      return { platform: 'whatsapp', url: trimmed, label: 'WhatsApp' };
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { platform: 'youtube', url: trimmed, label: 'YouTube' };
    }
    if (lower.includes('pinterest.com')) {
      return { platform: 'pinterest', url: trimmed, label: 'Pinterest' };
    }

    return {
      platform: 'website',
      url: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      label: 'Store Website',
    };
  } catch {
    return null;
  }
}

describe('Social Media Links Detection and Formatting', () => {
  it('detects Instagram, Facebook, WhatsApp, YouTube, and Pinterest from standard URLs', () => {
    expect(detectPlatform('https://instagram.com/maison_thread')?.platform).toBe('instagram');
    expect(detectPlatform('https://facebook.com/maisonthread')?.platform).toBe('facebook');
    expect(detectPlatform('https://wa.me/919876543210')?.platform).toBe('whatsapp');
    expect(detectPlatform('https://youtube.com/@maisonthread')?.platform).toBe('youtube');
    expect(detectPlatform('https://pinterest.com/maisonthread')?.platform).toBe('pinterest');
  });

  it('parses structured JSON social channel configurations correctly', () => {
    const jsonStr = JSON.stringify({
      platform: 'instagram',
      url: 'https://instagram.com/myboutique',
      isEnabled: true,
      order: 0,
    });

    const parsed = detectPlatform(jsonStr);
    expect(parsed).not.toBeNull();
    expect(parsed?.platform).toBe('instagram');
    expect(parsed?.url).toBe('https://instagram.com/myboutique');
  });

  it('filters out disabled social media links when isEnabled is false', () => {
    const disabledJson = JSON.stringify({
      platform: 'youtube',
      url: 'https://youtube.com/@boutique',
      isEnabled: false,
    });

    const parsed = detectPlatform(disabledJson);
    expect(parsed).toBeNull();
  });

  it('falls back cleanly to website for general external domains', () => {
    const parsed = detectPlatform('https://myboutique.com');
    expect(parsed?.platform).toBe('website');
    expect(parsed?.label).toBe('Store Website');
  });
});
