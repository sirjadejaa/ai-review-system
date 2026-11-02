import React from 'react';
import { BoutiqueLogo, type BoutiqueLogoProps } from './boutique-logo';

export type PharmacyLogoProps = BoutiqueLogoProps;

/**
 * Compatibility alias for BoutiqueLogo.
 * Renders the premium clothing boutique fashion mark.
 */
export const PharmacyLogo: React.FC<PharmacyLogoProps> = (props) => {
  return (
    <BoutiqueLogo
      shopName={props.shopName || 'Maison & Thread'}
      tagline={props.tagline || 'Luxury Apparel & Bespoke Studio'}
      {...props}
    />
  );
};

export default PharmacyLogo;
