import React from 'react';

export interface PharmacyLogoProps {
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
 * Pharmacy Brand Logo
 * Sophisticated minimal medical cross with subtle botanical leaf geometry.
 * Clean, clinical, established, and trustworthy.
 */
export const PharmacyLogo: React.FC<PharmacyLogoProps> = ({
  size = 'md',
  variant = 'mark',
  inverted = false,
  className = '',
  showSubtitle = true,
  shopName = 'Arogya Pharmacy',
  tagline = 'Better Health. Brighter Tomorrow.',
  logoUrl,
}) => {
  const pixelSizes = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 60,
  };

  const markSize = pixelSizes[size] || 36;

  // Colors based on inverted state
  const crossColor = inverted ? '#faf8f5' : '#123e35';
  const leafColor = inverted ? '#92bfa9' : '#2a6f55';
  const ringColor = inverted ? 'rgba(146, 191, 169, 0.25)' : 'rgba(18, 62, 53, 0.12)';
  const textColor = inverted ? '#ffffff' : '#14221d';
  const subtitleColor = inverted ? '#92bfa9' : '#667870';

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
      {/* Outer subtle shield/circle border */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill={inverted ? 'rgba(255, 255, 255, 0.06)' : '#f3efe8'}
        stroke={ringColor}
        strokeWidth="1.5"
      />

      {/* Vertical Cross Stem */}
      <rect
        x="21"
        y="12"
        width="6"
        height="24"
        rx="2"
        fill={crossColor}
      />

      {/* Horizontal Cross Arm */}
      <rect
        x="12"
        y="21"
        width="24"
        height="6"
        rx="2"
        fill={crossColor}
      />

      {/* Botanical Leaf Overlay - Symbolizing Arogya / Natural Healing */}
      <path
        d="M27 12C27 12 34 13 36 20C36 24 33 27 27 27C27 27 28 20 27 12Z"
        fill={leafColor}
        opacity="0.92"
      />
      <path
        d="M27 27C29 23 33 19 36 20"
        stroke={inverted ? '#102621' : '#ffffff'}
        strokeWidth="1.25"
        strokeLinecap="round"
      />

      {/* Subtle Center Dot of Precision */}
      <circle cx="24" cy="24" r="1.5" fill={inverted ? '#102621' : '#ffffff'} />
    </svg>
  );

  const markElement = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${shopName} logo`}
      width={markSize}
      height={markSize}
      style={{
        width: `${markSize}px`,
        height: `${markSize}px`,
        objectFit: 'contain',
        borderRadius: size === 'sm' ? '8px' : '12px',
        border: `1.5px solid ${ringColor}`,
        backgroundColor: inverted ? 'rgba(255, 255, 255, 0.08)' : '#f3efe8',
        padding: '3px',
        display: 'block',
        flexShrink: 0,
      }}
    />
  ) : (
    markSvg
  );

  if (variant === 'mark') {
    return <div className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>{markElement}</div>;
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 'var(--space-2)' : 'var(--space-3)',
      }}
    >
      {markElement}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontSize: size === 'sm' ? 'var(--font-size-base)' : size === 'lg' ? 'var(--font-size-xl)' : 'var(--font-size-lg)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: textColor,
          }}
        >
          {shopName}
        </span>
        {showSubtitle && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: subtitleColor,
              marginTop: '2px',
            }}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
