import type { Metadata } from 'next';
import Link from 'next/link';
import { CustomerLayout } from '@/components/layout/customer-layout';
import { Button, ErrorState } from '@/components/ui';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { listActiveOffers } from '@/lib/repositories/offer-repository';
import { listMenuCategories, listMenuItems } from '@/lib/repositories/menu-repository';
import { CustomerLandingQuerySchema } from '@/lib/validation/customer-query-schema';
import { QrScanTracker } from '@/components/customer/qr-scan-tracker';
import { CustomerContactActions } from '@/components/customer/customer-contact-actions';
import { OfferList } from '@/components/customer/offer-list';
import { DigitalMenu } from '@/components/customer/digital-menu';
import { SocialLinks } from '@/components/customer/social-links';
import { RestaurantLogo } from '@/components/brand/restaurant-logo';
import { Star, Utensils, Sparkles, MapPin, Clock, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dining Experience & Digital Menu',
  description: 'Explore our artisan culinary menu, savor fresh dishes, and share your dining review.',
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

  // 2. Retrieve ShopSettings, active offers & digital menu from database
  let settings;
  let activeOffers = [];
  let menuCategories = [];
  let menuItems = [];

  try {
    const [settingsResult, offersResult, categoriesResult, itemsResult] = await Promise.allSettled([
      getShopSettings(),
      listActiveOffers(),
      listMenuCategories(),
      listMenuItems({ isAvailable: true }),
    ]);

    if (settingsResult.status === 'rejected') {
      throw settingsResult.reason;
    }

    settings = settingsResult.value;
    activeOffers = offersResult.status === 'fulfilled' ? offersResult.value : [];
    menuCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
    menuItems = itemsResult.status === 'fulfilled' ? itemsResult.value : [];
  } catch (err) {
    console.error('Non-fatal: Failed to load shop settings for customer landing', err);
    return (
      <CustomerLayout shopName="The Olive & Hearth">
        <div style={{ padding: 'var(--space-8) 0' }}>
          <ErrorState
            title="Unable to load restaurant information"
            message="We're having trouble loading restaurant details right now. Please try again shortly."
          />
        </div>
      </CustomerLayout>
    );
  }

  const displayShopName =
    settings.shopName === 'Pharmacy' || settings.shopName === 'Maison & Thread'
      ? 'The Olive & Hearth'
      : settings.shopName;
  const displayTagline =
    settings.tagline || 'Artisanal Kitchen, Specialty Coffee & Wood-Fired Delicacies';
  const displayRestaurantType = settings.restaurantType || 'Café & Restaurant';

  const hasOpeningHours = settings.openingHours && settings.openingHours.length > 0;
  const hasAddress = Boolean(settings.address && settings.address.trim());
  const coverImage =
    settings.coverImageUrl ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

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
        {/* Editorial Restaurant Hero Banner (PraiseUp Inspired Warm Aesthetic) */}
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
          {/* Cover Photo with Soft Warm Gradient Overlay */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '190px',
              backgroundColor: '#25221F',
              backgroundImage: `linear-gradient(180deg, rgba(37, 34, 31, 0.25) 0%, rgba(37, 34, 31, 0.8) 100%), url(${coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
            }}
          >
            {/* Restaurant Type Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(37, 34, 31, 0.75)',
                border: '1px solid rgba(183, 131, 72, 0.4)',
                color: '#FAF7F2',
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} style={{ color: '#D9953B' }} />
              <span>{displayRestaurantType}</span>
            </div>

            {settings.cuisineTypes && settings.cuisineTypes.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 500,
                }}
              >
                {settings.cuisineTypes.slice(0, 2).join(' • ')}
              </div>
            )}
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
                <RestaurantLogo size="lg" variant="mark" shopName={displayShopName} />
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
                Artisanal Flavors &amp;<br />
                <span style={{ color: 'var(--color-accent)' }}>Memorable Dining</span>
              </h1>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  maxWidth: '420px',
                  margin: 'var(--space-2) auto 0',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {displayTagline}
              </p>
            </div>
          </div>
        </section>

        {/* Primary Action Buttons (PraiseUp Flow: Rate Meal & View Pass) */}
        <section
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          aria-label="Primary Restaurant Actions"
        >
          {/* Action 1: Rate & Review (Primary CTA) */}
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
              <Star size={18} fill="#D9953B" stroke="#D9953B" aria-hidden="true" />
              <span>Rate &amp; Review Your Dining Experience</span>
            </Button>
          </Link>

          {/* Action 2: Digital Dining Pass & Loyalty */}
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
              <Award size={18} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
              <span>VIP Dining Privilege Pass &amp; Perks</span>
            </Button>
          </Link>
        </section>

        {/* Contact shortcuts: Call Host, WhatsApp, Directions */}
        <section aria-label="Restaurant Contact and Directions">
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
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
            aria-label="Restaurant Location"
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
            aria-label="Restaurant Opening Hours"
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
                Kitchen &amp; Café Hours
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

        {/* Active Dining Offers & Chef Specials */}
        <OfferList offers={activeOffers} />

        {/* Centerpiece: Full Restaurant Digital Menu */}
        <DigitalMenu categories={menuCategories} items={menuItems} />

        {/* Social Media Links */}
        <SocialLinks socialLinks={settings.socialLinks} />
      </div>
    </CustomerLayout>
  );
}
