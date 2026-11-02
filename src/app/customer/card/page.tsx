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
import { isValidExternalUrl } from '@/lib/format/contact-links';
import { CustomerContactActions } from '@/components/customer/customer-contact-actions';
import { ShareCardButton } from '@/components/customer/share-card-button';
import { OfferList } from '@/components/customer/offer-list';
import { FeaturedProducts } from '@/components/customer/featured-products';
import { SocialLinks } from '@/components/customer/social-links';
import { ArrowLeft, Clock, MapPin, Phone, MessageCircle, Sparkles, Star } from 'lucide-react';
import { BoutiqueLogo } from '@/components/brand/boutique-logo';
import styles from '@/components/customer/digital-card.module.css';

export const metadata: Metadata = {
  title: 'Boutique Privilege Card',
  description: 'Operating hours, stylist contact channels, location, and seasonal offers for our clothing boutique.',
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

  // 2. Fetch ShopSettings, Active Offers, and Featured Products in parallel with resilient error handling
  let settings;
  let activeOffers = [];
  let featuredProducts = [];

  try {
    const [settingsResult, offersResult, productsResult] = await Promise.allSettled([
      getShopSettings(),
      listActiveOffers(),
      listFeaturedProducts(8),
    ]);

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason;
    }

    settings = settingsResult.value;
    activeOffers = offersResult.status === 'fulfilled' ? offersResult.value : [];
    featuredProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];
  } catch (error) {
    console.error('Non-fatal: Failed to load shop settings for customer card', error);
    return (
      <CustomerLayout shopName="Maison & Thread">
        <div style={{ padding: 'var(--space-8) 0' }}>
          <ErrorState
            title="Unable to load boutique card"
            message="We're having trouble loading the boutique card right now. Please try again shortly."
          />
        </div>
      </CustomerLayout>
    );
  }

  const displayShopName = settings.shopName === 'Pharmacy' ? 'Maison & Thread' : settings.shopName;
  const displayTagline = settings.tagline || 'Curated Contemporary Fashion & Bespoke Tailoring';

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
      shopName={displayShopName}
      tagline={displayTagline}
      logoUrl={settings.logoUrl}
      isEmergencyOpen={settings.isEmergencyOpen}
    >
      <div className={styles.container}>
        {/* Top Navigation Bar: Return to Home & Share Card */}
        <div className={styles.topNav}>
          <Link href={homeHref} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Boutique Home</span>
          </Link>
          <ShareCardButton shopName={displayShopName} />
        </div>

        {/* 1. Boutique Hero Identity Privilege Card */}
        <section className={styles.heroCard} aria-labelledby="card-shop-name">
          <div className={styles.cardHeaderBadge}>
            Boutique Privilege Pass
          </div>

          <BoutiqueLogo
            logoUrl={settings.logoUrl}
            shopName={displayShopName}
            variant="mark"
            size="lg"
          />

          <h1 id="card-shop-name" className={styles.shopName}>
            {displayShopName}
          </h1>

          <p className={styles.tagline}>{displayTagline}</p>
        </section>

        {/* 2. Quick Contact & Navigation Actions */}
        <section aria-label="Boutique Quick Actions">
          <CustomerContactActions
            phoneNumber={settings.phoneNumber}
            whatsappNumber={settings.whatsappNumber}
            googleMapsUrl={settings.googleMapsUrl}
          />
        </section>

        {/* 3. Operating Hours & Physical Location */}
        {(hasHours || hasAddress || hasPhone || hasWhatsApp) && (
          <section className={styles.infoCard} aria-label="Boutique Operating Hours and Address">
            <div className={styles.infoHeader}>
              <Clock size={16} color="var(--color-accent)" aria-hidden="true" />
              <h2 className={styles.infoTitle}>Hours &amp; Location</h2>
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
                Store hours currently unavailable.
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
                    <MessageCircle size={14} color="var(--color-accent)" aria-hidden="true" />
                    <span className={styles.contactDetailLabel}>WhatsApp:</span>
                    <span>{settings.whatsappNumber}</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. Active Offers & Collections */}
        <OfferList offers={activeOffers} />

        {/* 5. Featured Products Showcase */}
        <FeaturedProducts products={featuredProducts} />

        {/* 6. Social Media Channels */}
        <SocialLinks socialLinks={settings.socialLinks} />

        {/* 7. Direct Rating Link Callout */}
        <section className={styles.reviewCtaCard} aria-label="Write a Review">
          <div className={styles.reviewCtaContent}>
            <div className={styles.reviewCtaTitleGroup}>
              <Star size={20} fill="#d49b44" stroke="#d49b44" aria-hidden="true" />
              <h2 className={styles.reviewCtaTitle}>Visited our store recently?</h2>
            </div>
            <p className={styles.reviewCtaDescription}>
              Share your thoughts on clothing quality, fitting, and service. It only takes a minute.
            </p>
          </div>
          <Link href={reviewHref} style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="primary" size="lg" fullWidth>
              Write a Review
            </Button>
          </Link>
        </section>
      </div>
    </CustomerLayout>
  );
}
