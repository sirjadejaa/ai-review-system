import React from 'react';
import Link from 'next/link';
import styles from './customer-layout.module.css';
import { Badge } from '@/components/ui';
import { BoutiqueLogo } from '@/components/brand/boutique-logo';

export interface CustomerLayoutProps {
  children: React.ReactNode;
  shopName?: string;
  tagline?: string;
  logoUrl?: string | null;
  isEmergencyOpen?: boolean;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  shopName = 'Maison & Thread',
  tagline = 'Curated Contemporary Apparel & Studio',
  logoUrl,
  isEmergencyOpen = false,
}) => {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={`container-customer ${styles.headerContent}`}>
          <Link href="/" className={styles.brandLink}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`${shopName} logo`}
                className={styles.brandLogo}
              />
            ) : (
              <BoutiqueLogo size="sm" variant="mark" shopName={shopName} />
            )}
            <div className={styles.brandText}>
              <span className={styles.shopName} style={{ fontFamily: 'var(--font-family-serif)', fontSize: '1.1rem', letterSpacing: '-0.02em', fontWeight: 600 }}>
                {shopName}
              </span>
              <span className={styles.shopCategory}>
                {tagline || 'Curated Contemporary Apparel & Studio'}
              </span>
            </div>
          </Link>
          {isEmergencyOpen ? (
            <Badge variant="warning" size="sm" hasDot>
              Extended Hours
            </Badge>
          ) : (
            <Badge variant="success" size="sm" hasDot>
              Open Today
            </Badge>
          )}
        </div>
      </header>

      <main className={`container-customer ${styles.main}`}>{children}</main>

      <footer className={styles.footer}>
        <div className="container-customer">
          <p className={styles.footerText}>
            © {new Date().getFullYear()} {shopName}
            {tagline ? ` • ${tagline}` : ' • Curated Contemporary Apparel & Studio'}
          </p>
        </div>
      </footer>
    </div>
  );
};

CustomerLayout.displayName = 'CustomerLayout';
