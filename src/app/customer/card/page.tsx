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
import { isValidExternalUrl } from '@/lib/format/contact-links';
import { CustomerContactActions } from '@/components/customer/customer-contact-actions';
import { ShareCardButton } from '@/components/customer/share-card-button';
import { OfferList } from '@/components/customer/offer-list';
import { ArrowLeft, Clock, MapPin, Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import { PharmacyLogo } from '@/components/brand/pharmacy-logo';
import styles from '@/components/customer/digital-card.module.css';

export const metadata: Metadata = {
  title: 'Digital Customer Card',
  description: 'Operating hours, contact channels, location, and medicine offers for our pharmacy.',
};

interface CustomerCardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomerCardPage({ searchParams }: CustomerCardPageProps) {
  // 1. Resolve and validate QR source query parameter
  const resolvedParams = await searchParams;
  const rawSource = typeof resolvedParams.source === 'string' ? resolvedParams.source : undefined;
  const parsedQuery = CustomerLandingQuerySchema.safeParse({ source: rawSource });
  const validatedSource = parsedQuery.success ? parsedQuery.data.source : undefined;

  // 2. Fetch ShopSettings and Active Offers in parallel with resilient error handling
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
  } catch (error) {
    console.error('Non-fatal: Failed to load shop settings for customer card', error);
    return (
      <CustomerLayout shopName="Medical & Pharmacy">
        <div style={{ padding: 'var(--space-8) 0' }}>
          <ErrorState
            title="Unable to load pharmacy card"
            message="We're having trouble loading the pharmacy card right now. Please try again shortly."
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
              Pharmacy Card Under Setup
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
                margin: 0,
              }}
            >
              This digital pharmacy card is currently being configured. Please visit our counter or check back soon.
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  // 3. Navigation URLs preserving source context
  const homeHref = validatedSource ? `/?source=${validatedSource}` : '/';
  const reviewHref = validatedSource ? `/customer/review?source=${validatedSource}` : '/customer/review';

  // 4. Validate Google URLs
  const hasValidReviewUrl = Boolean(
    settings.googleReviewUrl && isValidExternalUrl(settings.googleReviewUrl)
  );

  // 5. Filter and validate opening hour slots
  const validHours = Array.isArray(settings.openingHours)
    ? settings.openingHours.filter(
        (slot) =>
          slot &&
          typeof slot.days === 'string' &&
          typeof slot.hours === 'string' &&
          slot.days.trim() &&
          slot.hours.trim()
      )
    : [];

  const hasHours = validHours.length > 0;
  const hasAddress = Boolean(settings.address && settings.address.trim());
  const hasPhone = Boolean(settings.phoneNumber && settings.phoneNumber.trim());
  const hasWhatsApp = Boolean(settings.whatsappNumber && settings.whatsappNumber.trim());

  return (
    <CustomerLayout
      shopName={settings.shopName}
      tagline={settings.tagline ?? undefined}
      logoUrl={settings.logoUrl}
      isEmergencyOpen={settings.isEmergencyOpen}
    >
      <div className={styles.container}>
        {/* Top Navigation Bar: Return to Home & Share Card */}
        <div className={styles.topNav}>
          <Link href={homeHref} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Pharmacy Home</span>
          </Link>
          <ShareCardButton shopName={settings.shopName} />
        </div>

        {/* 1. Pharmacy Hero Identity Card */}
        <section className={styles.heroCard} aria-labelledby="card-shop-name">
          <div className={styles.cardHeaderBadge}>
            Official Pharmacy Pass
          </div>

          <PharmacyLogo
            logoUrl={settings.logoUrl}
            shopName={settings.shopName}
            variant="mark"
            size="lg"
          />

          <h1 id="card-shop-name" className={styles.shopName}>
            {settings.shopName}
          </h1>

          {settings.tagline && (
            <p className={styles.tagline}>{settings.tagline}</p>
          )}

          {/* Emergency Availability Notice */}
          {settings.isEmergencyOpen && (
            <div className={styles.emergencyBanner} role="status">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>Emergency Availability: Essential medicine support open</span>
            </div>
          )}
        </section>

        {/* 2. Quick Contact & Navigation Actions */}
        <section aria-label="Pharmacy Quick Actions">
          <CustomerContactActions
            phoneNumber={settings.phoneNumber}
            whatsappNumber={settings.whatsappNumber}
            googleMapsUrl={settings.googleMapsUrl}
          />
        </section>

        {/* 3. Operating Hours & Physical Location */}
        {(hasHours || hasAddress || hasPhone || hasWhatsApp) && (
          <section className={styles.infoCard} aria-label="Pharmacy Operating Hours and Address">
            <div className={styles.infoHeader}>
              <Clock size={16} color="var(--color-secondary)" aria-hidden="true" />
              <h2 className={styles.infoTitle}>Hours & Store Information</h2>
            </div>

            {/* Operating Hours */}
            {hasHours ? (
              <div className={styles.hoursList}>
                {validHours.map((slot, index) => (
                  <div key={index} className={styles.hourRow}>
                    <span className={styles.hourDays}>{slot.days}</span>
                    <span className={styles.hourTimes}>{slot.hours}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.hoursUnavailable}>
                Opening hours currently unavailable.
              </p>
            )}

            {/* Physical Address */}
            {hasAddress && (
              <div className={styles.addressBox}>
                <MapPin size={18} className={styles.addressIcon} aria-hidden="true" />
                <span className={styles.addressText}>{settings.address}</span>
              </div>
            )}

            {/* Phone & WhatsApp Display Numbers */}
            {(hasPhone || hasWhatsApp) && (
              <div className={styles.contactDetailsRow}>
                {hasPhone && (
                  <div className={styles.contactDetailItem}>
                    <Phone size={14} color="var(--color-primary)" aria-hidden="true" />
                    <span className={styles.contactDetailLabel}>Phone:</span>
                    <span>{settings.phoneNumber}</span>
                  </div>
                )}
                {hasWhatsApp && (
                  <div className={styles.contactDetailItem}>
                    <MessageCircle size={14} color="var(--color-secondary)" aria-hidden="true" />
                    <span className={styles.contactDetailLabel}>WhatsApp:</span>
                    <span>{settings.whatsappNumber}</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. Active Store Offers & Promotions (Read-Only) */}
        <OfferList offers={activeOffers} />

        {/* 5. Google Review Action (Preserving Source Attribution) */}
        {hasValidReviewUrl && (
          <section aria-label="Review Pharmacy">
            <Card variant="interactive">
              <CardHeader>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <Badge variant="success" size="sm">
                    Takes 30 seconds
                  </Badge>
                  <Rating value={5} isReadOnly size="sm" />
                </div>
                <CardTitle as="h2">Give a Google Review</CardTitle>
                <CardDescription>
                  Share your honest experience to help other patients find trusted medicines and caring service.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={reviewHref} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="lg" fullWidth>
                    ⭐ Give a Review
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </CustomerLayout>
  );
}
