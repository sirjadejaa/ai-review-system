'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Globe } from 'lucide-react';
import styles from './social-links.module.css';

export interface SocialLinksProps {
  socialLinks?: string[] | null;
}

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
    // If it's a JSON object string: {"platform":"instagram","url":"...","isEnabled":true}
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
    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return { platform: 'website', url: trimmed, label: 'Website' };
    }
  } catch {
    // Ignore malformed strings
  }

  return null;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ socialLinks }) => {
  const { t } = useLanguage();

  if (!socialLinks || socialLinks.length === 0) {
    return null;
  }

  const validLinks: ParsedSocialLink[] = socialLinks
    .map(detectPlatform)
    .filter((item): item is ParsedSocialLink => item !== null);

  if (validLinks.length === 0) {
    return null;
  }

  const renderIcon = (platform: ParsedSocialLink['platform']) => {
    switch (platform) {
      case 'instagram':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case 'facebook':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
          </svg>
        );
      case 'whatsapp':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'pinterest':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.332 1.357-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
          </svg>
        );
      default:
        return <Globe size={20} aria-hidden="true" />;
    }
  };

  return (
    <div className={styles.container} aria-label="Social media connections">
      <h3 className={styles.title}>{t.connectTitle}</h3>
      <p className={styles.subtitle}>{t.connectSubtitle}</p>

      <div className={styles.iconRow}>
        {validLinks.map((item, idx) => (
          <a
            key={`${item.platform}-${idx}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.iconLink} ${styles[item.platform] || ''}`}
            aria-label={`Visit our ${item.label}`}
            title={item.label}
          >
            {renderIcon(item.platform)}
          </a>
        ))}
      </div>
    </div>
  );
};

export default SocialLinks;
