import type { Metadata } from 'next';
import Link from 'next/link';
import { CustomerLayout } from '@/components/layout/customer-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Rating,
  ErrorState,
} from '@/components/ui';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { listActiveOffers } from '@/lib/repositories/offer-repository';
import { listFeaturedProducts } from '@/lib/repositories/product-repository';
import { CustomerLandingQuerySchema } from '@/lib/validation/customer-query-schema';
import { QrScanTracker } from '@/components/customer/qr-scan-tracker';
import { CustomerContactActions } from '@/components/customer/customer-contact-actions';
import { OfferList } from '@/components/customer/offer-list';
import { FeaturedProducts } from '@/components/customer/featured-products';
import { SocialLinks } from '@/components/customer/social-links';
import { BoutiqueLogo } from '@/components/brand/boutique-logo';
import { Star, CreditCard, Sparkles, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home & Customer Experience',
  description: 'Share your clothing store visit experience or access our digital boutique privilege card.',
};

interface CustomerLandingPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomerLandingPage({ searchParams }: CustomerLandingPageProps) {
  // 1. Resolve and safely validate incoming QR query parameters
  const resolvedParams = await searchParams;
  const rawSource = typeof resolvedParams.source === 'string' ? resolvedParams.source : undefined;
  const parsedQuery = CustomerLandingQuerySchema.safeParse({ source: rawSource });
  const validatedSource = parsedQuery.success ? parsedQuery.data.source : undefined;

  // 2. Retrieve ShopSettings, active offers & featured products from database
  let settings;
  let activeOffers = [];
  let featuredProducts = [];

  try {
    const [settingsResult, offersResult, productsResult] = await Promise.allSettled([
      getShopSettings(),
      listActiveOffers(),
      listFeaturedProducts(12),
    ]);

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason;
    }

    settings = settingsResult.value;
    activeOffers = offersResult.status === 'fulfilled' ? offersResult.value : [];
    featuredProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];
  } catch (err) {
    console.error('Non-fatal: Failed to load shop settings for customer landing', err);
    return (
      <CustomerLayout shopName="Maison & Thread">
        <div style={{ padding: 'var(--space-8) 0' }}>
          <ErrorState
            title="Unable to load boutique information"
            message="We're having trouble loading store details right now. Please try again shortly."
          />
        </div>
      </CustomerLayout>
    );
  }

  // Controlled empty setup state for a brand-new installation without store profile
  const isUnconfigured =
    !settings.shopName ||
    ((settings.shopName === 'Pharmacy' || settings.shopName === 'Maison & Thread') &&
      !settings.phoneNumber &&
      !settings.address &&
      !settings.googleReviewUrl);

  const displayShopName = settings.shopName === 'Pharmacy' ? 'Maison & Thread' : settings.shopName;
  const displayTagline = settings.tagline || 'Curated Contemporary Fashion & Bespoke Tailoring';

  const hasOpeningHours = settings.openingHours && settings.openingHours.length > 0;
  const hasAddress = Boolean(settings.address && settings.address.trim());

  return (
    <CustomerLayout
      shopName={displayShopName}
      tagline={displayTagline}
      logoUrl={settings.logoUrl}
      isEmergencyOpen={settings.isEmergencyOpen}
    >
      {/* Invisible QR scan tracker (tracks once, prevents repeat/refresh duplicates) */}
      <QrScanTracker source={validatedSource} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Editorial Visual Hero Panel (PraiseUp Inspired Warm Canvas) */}
        <section
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-surface)',
            boxShadow: 'var(--shadow-card)',
          }}
          aria-labelledby="welcome-heading"
        >
          {/* Fashion Atelier Header Pattern with Warm Gradient */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '180px',
              backgroundColor: '#1E1E1E',
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2621 50%, #383127 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Subtle Atelier Ambient Geometric Lines */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.15,
                backgroundImage: 'radial-gradient(#A88B64 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            {/* Editorial Fashion Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(168, 139, 100, 0.3)',
                color: '#E8D8C3',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Sparkles size={13} style={{ color: '#D49B44' }} />
              <span>Autumn / Winter Collection</span>
            </div>
          </div>

          <div
            style={{
              padding: '0 var(--space-5) var(--space-6)',
              marginTop: '-44px',
              position: 'relative',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={`${displayShopName} logo`}
                style={{
                  width: '76px',
                  height: '76px',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid #ffffff',
                  backgroundColor: '#ffffff',
                  boxShadow: 'var(--shadow-md)',
                  padding: 'var(--space-1)',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '4px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <BoutiqueLogo size="lg" variant="mark" shopName={displayShopName} />
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {displayShopName}
              </div>
              <h1
                id="welcome-heading"
                className="editorial-title"
                style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                Bespoke Quality<br />
                <span style={{ color: 'var(--color-accent)' }}>Curated For You</span>
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  maxWidth: '380px',
                  margin: 'var(--space-2) auto 0',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {displayTagline}
              </p>
            </div>
          </div>
        </section>

        {/* Primary Action Hierarchy (PraiseUp Review Flow & Digital Card) */}
        <section
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          aria-label="Primary Boutique Actions"
        >
          {/* Action 1: Give a Review (Primary CTA) */}
          <Link
            href={validatedSource ? `/customer/review?source=${validatedSource}` : '/customer/review'}
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              style={{
                minHeight: '54px',
                fontSize: '1.025rem',
                letterSpacing: '0.01em',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Star size={18} fill="#d49b44" stroke="#d49b44" aria-hidden="true" />
              <span>Rate &amp; Review Your Visit</span>
            </Button>
          </Link>

          {/* Action 2: Digital Privilege Card (Secondary CTA) */}
          <Link
            href={validatedSource ? `/customer/card?source=${validatedSource}` : '/customer/card'}
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="outline"
              size="lg"
              fullWidth
              style={{
                minHeight: '48px',
                backgroundColor: 'var(--color-bg-surface)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <CreditCard size={18} aria-hidden="true" />
              <span>Boutique Privilege Card &amp; Offers</span>
            </Button>
          </Link>
        </section>

        {/* Contact shortcuts: Call Stylist, WhatsApp, Directions */}
        <section aria-label="Contact and Directions">
          <CustomerContactActions
            phoneNumber={settings.phoneNumber}
            whatsappNumber={settings.whatsappNumber}
            googleMapsUrl={settings.googleMapsUrl}
          />
        </section>

        {/* Physical Address */}
        {hasAddress && (
          <section
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-bg-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
            aria-label="Boutique Location"
          >
            <MapPin size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
            <span>{settings.address}</span>
          </section>
        )}

        {/* Operating Hours */}
        {hasOpeningHours && (
          <section
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4) var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
            aria-label="Boutique Hours"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              <Clock size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} aria-hidden="true" />
              <h2
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Store Hours
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {settings.openingHours.map((slot, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                    {slot.days}
                  </span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {slot.hours}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Offers & Promotions */}
        <OfferList offers={activeOffers} />

        {/* Featured Clothing Products Showcase */}
        <FeaturedProducts products={featuredProducts} />

        {/* Social Media Links */}
        <SocialLinks socialLinks={settings.socialLinks} />
      </div>
    </CustomerLayout>
  );
}
