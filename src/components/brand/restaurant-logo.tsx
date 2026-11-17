import React from 'react';

export interface RestaurantLogoProps {
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
 * Premium Restaurant & Café Brand Logo
 * Elegant culinary mark featuring cloche lid, steam curve, and artisan warmth.
 * PraiseUp-inspired editorial hospitality aesthetic.
 */
export const RestaurantLogo: React.FC<RestaurantLogoProps> = ({
  size = 'md',
  variant = 'mark',
  inverted = false,
  className = '',
  showSubtitle = true,
  shopName = 'The Olive & Hearth',
  tagline = 'Artisan Kitchen & Café',
  logoUrl,
}) => {
  const pixelSizes = {
    sm: 28,
    md: 38,
    lg: 50,
    xl: 64,
  };

  const markSize = pixelSizes[size] || 38;

  // Theme colors
  const iconStroke = inverted ? '#FAF7F2' : '#25221F';
  const accentColor = inverted ? '#D9953B' : '#B78348';
  const ringBg = inverted ? 'rgba(255, 255, 255, 0.08)' : '#F5EFEB';
  const ringBorder = inverted ? 'rgba(255, 255, 255, 0.15)' : '#EAE4DB';
  const textColor = inverted ? '#FFFFFF' : '#26231F';
  const subtitleColor = inverted ? '#CEC4B7' : '#817970';

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
      {/* Background soft rounded container */}
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

      {/* Steam / Aroma Curves */}
      <path
        d="M20 12C20 10 21 9 20 8M24 13C24 10.5 25 9.5 24 7M28 12C28 10 29 9 28 8"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Gourmet Cloche / Dining Dome */}
      <path
        d="M13 28C13 20.8203 17.9249 15 24 15C30.0751 15 35 20.8203 35 28H13Z"
        fill={accentColor}
        fillOpacity="0.12"
        stroke={iconStroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Cloche Handle Top */}
      <path
        d="M22 15C22 13.8954 22.8954 13 24 13C25.1046 13 26 13.8954 26 15"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Serving Platter Base Tray */}
      <path
        d="M10 32C10 30.8954 10.8954 30 12 30H36C37.1046 30 38 30.8954 38 32V33H10V32Z"
        fill={iconStroke}
      />
      <line
        x1="12"
        y1="36"
        x2="36"
        y2="36"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
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

export const BoutiqueLogo = RestaurantLogo;
export type BoutiqueLogoProps = RestaurantLogoProps;
export default RestaurantLogo;
