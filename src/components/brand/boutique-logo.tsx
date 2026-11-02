import React from 'react';

export interface BoutiqueLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark' | 'full';
  inverted?: boolean;
  className?: string;
  showSubtitle?: boolean;
  shopName?: string;
  tagline?: string;
  logoUrl?: string | null;
}

/**
 * Premium Clothing Boutique Brand Logo
 * Elegant fashion atelier hanger & monogram crest design.
 * High-end, editorial, luxurious, and modern.
 */
export const BoutiqueLogo: React.FC<BoutiqueLogoProps> = ({
  size = 'md',
  variant = 'mark',
  inverted = false,
  className = '',
  showSubtitle = true,
  shopName = 'Maison & Thread',
  tagline = 'Luxury Apparel & Bespoke Studio',
  logoUrl,
}) => {
  const pixelSizes = {
    sm: 28,
    md: 38,
    lg: 50,
    xl: 64,
  };

  const markSize = pixelSizes[size] || 38;

  // Colors based on inverted state
  const iconStroke = inverted ? '#FAF9F6' : '#171717';
  const accentColor = inverted ? '#C5A880' : '#A88B64';
  const ringBg = inverted ? 'rgba(255, 255, 255, 0.08)' : '#F5F3EF';
  const ringBorder = inverted ? 'rgba(255, 255, 255, 0.15)' : '#E8E5DF';
  const textColor = inverted ? '#FFFFFF' : '#171717';
  const subtitleColor = inverted ? '#B3B0A8' : '#77736E';

  const markSvg = (
    <svg
      width={markSize}
      height={markSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Background soft pill/rounded container */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="10"
        fill={ringBg}
        stroke={ringBorder}
        strokeWidth="1.25"
      />

      {/* Atelier Hanger Hook Loop */}
      <path
        d="M24 12C22.3431 12 21 13.3431 21 15C21 16.6569 22.3431 18 24 18V21"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Atelier Hanger Shoulders */}
      <path
        d="M24 21L12 28.5C11.5 28.8 11.8 29.5 12.4 29.5H35.6C36.2 29.5 36.5 28.8 36 28.5L24 21Z"
        stroke={iconStroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Lower Trouser / Fabric Drape Bar */}
      <line
        x1="14"
        y1="34"
        x2="34"
        y2="34"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Subtle Atelier Diamond Star */}
      <circle cx="24" cy="27" r="1.5" fill={accentColor} />
    </svg>
  );

  if (logoUrl) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={`${shopName} logo`}
          style={{
            width: markSize,
            height: markSize,
            objectFit: 'contain',
            borderRadius: '8px',
            border: `1px solid ${ringBorder}`,
            backgroundColor: '#ffffff',
            padding: '2px',
          }}
        />
        {variant === 'full' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-serif)',
                fontSize: size === 'lg' ? '1.25rem' : size === 'sm' ? '0.9rem' : '1.05rem',
                fontWeight: 600,
                color: textColor,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {shopName}
            </span>
            {showSubtitle && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: subtitleColor,
                  marginTop: '1px',
                }}
              >
                {tagline}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'mark') {
    return <div className={className}>{markSvg}</div>;
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {markSvg}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontSize: size === 'lg' ? '1.25rem' : size === 'sm' ? '0.9rem' : '1.05rem',
            fontWeight: 600,
            color: textColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {shopName}
        </span>
        {showSubtitle && (
          <span
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: subtitleColor,
              marginTop: '1px',
            }}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};

export default BoutiqueLogo;
