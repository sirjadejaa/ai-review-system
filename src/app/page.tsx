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
import { CustomerLandingQuerySchema } from '@/lib/validation/customer-query-schema';
import { QrScanTracker } from '@/components/customer/qr-scan-tracker';
import { CustomerContactActions } from '@/components/customer/customer-contact-actions';
import { OfferList } from '@/components/customer/offer-list';
import { PharmacyLogo } from '@/components/brand/pharmacy-logo';

export const metadata: Metadata = {
  title: 'Home & Customer Portal',
  description: 'Share your pharmacy visit experience or access our digital pharmacy card.',
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

  // 2. Retrieve ShopSettings & active offers from database
  let settings;
  let activeOffers = [];

  try {
    const [settingsResult, offersResult] = await Promise.allSettled([
      getShopSettings(),
      listActiveOffers(),
    ]);

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason;
    }

    settings = settingsResult.value;
    activeOffers = offersResult.status === 'fulfilled' ? offersResult.value : [];
  } catch (err) {
    console.error('Non-fatal: Failed to load shop settings for customer landing', err);
    return (
      <CustomerLayout shopName="Pharmacy">
        <div style={{ padding: 'var(--space-8) 0' }}>
          <ErrorState
            title="Unable to load pharmacy information"
            message="We're having trouble loading the pharmacy details right now. Please try again shortly."
          />
        </div>
      </CustomerLayout>
    );
  }

  // Controlled empty setup state for a brand-new installation without pharmacy profile
  const isUnconfigured =
    !settings.shopName ||
    (settings.shopName === 'Pharmacy' &&
      !settings.phoneNumber &&
      !settings.address &&
      !settings.googleReviewUrl);

  if (isUnconfigured) {
    return (
      <CustomerLayout shopName="Pharmacy">
        <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8) var(--space-6)',
              maxWidth: '460px',
              margin: '0 auto',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
              <PharmacyLogo size="lg" variant="mark" />
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
                margin: '0 0 var(--space-2)',
              }}
            >
              Pharmacy Portal Under Setup
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
                margin: 0,
              }}
            >
              This customer portal is currently being initialized by the pharmacy staff. Please visit our store counter or check back soon.
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const hasOpeningHours = settings.openingHours && settings.openingHours.length > 0;
  const hasAddress = Boolean(settings.address && settings.address.trim());

  return (
    <CustomerLayout
      shopName={settings.shopName}
      tagline={settings.tagline ?? undefined}
      logoUrl={settings.logoUrl}
      isEmergencyOpen={settings.isEmergencyOpen}
    >
      {/* Invisible QR scan tracker (tracks once, prevents repeat/refresh duplicates) */}
      <QrScanTracker source={validatedSource} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Editorial Visual Hero Panel */}
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
          {/* Editorial Pharmacy Photo Banner with Soft Gradient Overlay */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '190px',
              backgroundColor: 'var(--color-primary-bg)',
              backgroundImage: 'url(/images/arogya-hero.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(18, 62, 53, 0.15) 0%, rgba(250, 248, 245, 0.95) 100%)',
              }}
            />
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
                alt={`${settings.shopName} logo`}
                style={{
                  width: '72px',
                  height: '72px',
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
                <PharmacyLogo size="lg" variant="mark" />
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-secondary)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {settings.shopName}
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
                Your Health<br />
                <span style={{ color: 'var(--color-primary)' }}>Our Priority</span>
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
                Trusted care, quality medicines and expert support — always.
              </p>
            </div>

            {/* Emergency availability notice if active */}
            {settings.isEmergencyOpen && (
              <div
                style={{
                  backgroundColor: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-2) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-warning-text)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginTop: 'var(--space-1)',
                }}
                role="status"
              >
                <span aria-hidden="true">🚨</span>
                <span>Emergency Availability: Essential medicine support open</span>
              </div>
            )}
          </div>
        </section>

        {/* Primary Action Hierarchy (Review & Digital Card) */}
        <section
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          aria-label="Primary Pharmacy Actions"
        >
          {/* Action 1: Give a Review (Primary CTA) */}
          <Link
            href={validatedSource ? `/customer/review?source=${validatedSource}` : '/customer/review'}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="primary" size="lg" fullWidth style={{ minHeight: '52px', fontSize: '1rem', letterSpacing: '0.01em' }}>
              ⭐ Give a Review
            </Button>
          </Link>

          {/* Action 2: Digital Card (Secondary CTA) */}
          <Link
            href={validatedSource ? `/customer/card?source=${validatedSource}` : '/customer/card'}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outline" size="lg" fullWidth style={{ minHeight: '48px', backgroundColor: '#ffffff' }}>
              💳 Digital Card
            </Button>
          </Link>
        </section>

        {/* 7: Contact shortcuts */}
        <section aria-label="Contact and Directions">
          <CustomerContactActions
            phoneNumber={settings.phoneNumber}
            whatsappNumber={settings.whatsappNumber}
            googleMapsUrl={settings.googleMapsUrl}
          />
        </section>

        {/* 8: Address */}
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
            aria-label="Pharmacy Address"
          >
            <span aria-hidden="true" style={{ lineHeight: 1.4 }}>
              📍
            </span>
            <span>{settings.address}</span>
          </section>
        )}

        {/* 9: Opening Hours */}
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
            aria-label="Pharmacy Hours"
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
              <span aria-hidden="true" style={{ fontSize: 'var(--font-size-base)' }}>
                🕒
              </span>
              <h2
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Operating Hours
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

        {/* 10: Active Offers if configured */}
        <OfferList offers={activeOffers} />
      </div>
    </CustomerLayout>
  );
}

