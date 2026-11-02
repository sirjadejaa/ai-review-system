'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Tag,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  User,
  QrCode,
  ShoppingBag,
  Star,
} from 'lucide-react';
import styles from './admin-layout.module.css';
import { logoutAction } from '@/lib/auth/actions';
import { BoutiqueLogo } from '@/components/brand/boutique-logo';
import { StoreQrModal } from '@/components/admin/store-qr-modal';

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  logoUrl?: string | null;
  shopName?: string;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/google-reviews', label: 'Google Reviews', icon: Star },
  { href: '/admin/products', label: 'Products Showcase', icon: ShoppingBag },
  { href: '/admin/offers', label: 'Special Offers', icon: Tag },
  { href: '/admin/reviews', label: 'Internal Feedback', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Boutique Settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  logoUrl,
  shopName = 'Maison & Thread',
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const displayShopName = shopName === 'Pharmacy' ? 'Maison & Thread' : shopName;

  const navContent = (
    <>
      <div className={styles.sidebarHeader}>
        <Link href="/admin" className={styles.brandLink} onClick={() => setMobileMenuOpen(false)}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${displayShopName} logo`}
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                padding: '2px',
              }}
            />
          ) : (
            <BoutiqueLogo size="md" variant="mark" inverted={true} shopName={displayShopName} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-serif)',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
              }}
            >
              {displayShopName}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#c5a880',
                marginTop: '2px',
              }}
            >
              Management Console
            </span>
          </div>
        </Link>
        {mobileMenuOpen && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#d4d0c8',
              cursor: 'pointer',
              padding: 'var(--space-1)',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className={styles.sidebarNav} aria-label="Boutique Workspace Navigation">
        <span className={styles.navSectionLabel}>Workspace</span>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'rgba(168, 139, 100, 0.2)',
            border: '1px solid rgba(168, 139, 100, 0.4)',
            borderRadius: 'var(--radius-md)',
            color: '#FAF9F6',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <QrCode size={15} style={{ color: '#c5a880' }} />
          <span>Get Store QR Standee</span>
        </button>

        <div className={styles.sidebarFooterUser}>
          <div className={styles.userAvatar}>
            <User size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#ffffff' }}>
              Store Owner
            </span>
            <span className={styles.userRole}>Boutique Administrator</span>
          </div>
        </div>

        <form action={logoutAction}>
          <button type="submit" className={styles.logoutButton}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>{navContent}</aside>

      <div className={styles.mainContent}>
        <header className={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className={styles.mobileMenuToggle}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className={styles.topBarTitle}>{title || 'Dashboard'}</h1>
              {subtitle && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className={styles.topBarActions}>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <QrCode size={14} style={{ color: 'var(--color-accent)' }} />
              <span>QR Code</span>
            </button>

            <Link
              href="/"
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <span>View Customer Portal</span>
              <ExternalLink size={13} style={{ color: 'var(--color-text-muted)' }} />
            </Link>
          </div>
        </header>

        <main className={styles.contentWrapper}>{children}</main>
      </div>

      {mobileMenuOpen && (
        <div className={styles.mobileDrawer} onClick={() => setMobileMenuOpen(false)}>
          <div className={styles.mobileDrawerContent} onClick={(e) => e.stopPropagation()}>
            {navContent}
          </div>
        </div>
      )}

      <StoreQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        shopName={displayShopName}
      />
    </div>
  );
};

AdminLayout.displayName = 'AdminLayout';
