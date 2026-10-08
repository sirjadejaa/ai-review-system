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
} from 'lucide-react';
import styles from './admin-layout.module.css';
import { logoutAction } from '@/lib/auth/actions';
import { PharmacyLogo } from '@/components/brand/pharmacy-logo';
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
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/reviews', label: 'Reviews & Feedback', icon: MessageSquare },
  { href: '/admin/offers', label: 'Promotional Offers', icon: Tag },
  { href: '/admin/settings', label: 'Pharmacy Settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  logoUrl,
  shopName = 'Pharmacy',
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const navContent = (
    <>
      <div className={styles.sidebarHeader}>
        <Link href="/admin" className={styles.brandLink} onClick={() => setMobileMenuOpen(false)}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${shopName} logo`}
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
            <PharmacyLogo size="md" variant="mark" inverted={true} />
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
              {shopName}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#92bfa9',
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
              color: '#c4d7ce',
              cursor: 'pointer',
              padding: 'var(--space-1)',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className={styles.sidebarNav} aria-label="Pharmacy Workspace Navigation">
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
        <Link href="/" target="_blank" className={styles.liveStoreLink}>
          <span>Public Customer View</span>
          <ExternalLink size={14} />
        </Link>
        <form action={logoutAction} style={{ margin: 0 }}>
          <button type="submit" className={styles.signOutBtn}>
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className={styles.adminContainer}>
      {/* Desktop Persistent Sidebar */}
      <aside className={styles.sidebar}>
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setMobileMenuOpen(false)} />
          <aside className={`${styles.sidebar} ${styles.sidebarOpen}`}>
            {navContent}
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className={styles.contentWrapper}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className={styles.headerContext}>
              <div className={styles.headerContextDot} />
              <span>{shopName}</span>
              <span style={{ color: 'var(--color-border)' }}>•</span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                Management Console
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={styles.qrHeaderBtn}
              onClick={() => setShowQrModal(true)}
              title="View & Download Store QR Codes"
            >
              <QrCode size={14} />
              <span>Store QR Codes</span>
            </button>
            <div className={styles.ownerAvatar} title="Admin Session">
              <div className={styles.avatarBadge} aria-label="Administrator">
                <User size={14} />
              </div>
              <span>Admin</span>
            </div>
          </div>
        </header>

        <main className={styles.mainContent}>
          {(title || subtitle) && (
            <div className={styles.pageHeader}>
              {title && <h1 className={styles.heading}>{title}</h1>}
              {subtitle && <p className={styles.subheading}>{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Store QR Codes & Standee Modal */}
      <StoreQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        shopName={shopName}
      />
    </div>
  );
};

AdminLayout.displayName = 'AdminLayout';
