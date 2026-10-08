import React from 'react';
import Link from 'next/link';
import styles from './customer-layout.module.css';
import { Badge } from '@/components/ui';

import { PharmacyLogo } from '@/components/brand/pharmacy-logo';

export interface CustomerLayoutProps {
  children: React.ReactNode;
  shopName?: string;
  tagline?: string;
  logoUrl?: string | null;
  isEmergencyOpen?: boolean;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  children,
  shopName = 'Pharmacy',
  tagline,
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
              <PharmacyLogo size="md" variant="mark" />
            )}
            <div className={styles.brandText}>
              <span className={styles.shopName} style={{ fontFamily: 'var(--font-family-serif)', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                {shopName}
              </span>
              <span className={styles.shopCategory}>Licensed Healthcare & Pharmacy</span>
            </div>
          </Link>
          {isEmergencyOpen ? (
            <Badge variant="warning" size="sm" hasDot>
              Emergency Open
            </Badge>
          ) : (
            <Badge variant="success" size="sm" hasDot>
              Open Now
            </Badge>
          )}
        </div>
      </header>

      <main className={`container-customer ${styles.main}`}>{children}</main>

      <footer className={styles.footer}>
        <div className="container-customer">
          <p className={styles.footerText}>
            © {new Date().getFullYear()} {shopName}
            {tagline ? ` • ${tagline}` : ''}
          </p>
        </div>
      </footer>
    </div>
  );
};

CustomerLayout.displayName = 'CustomerLayout';
