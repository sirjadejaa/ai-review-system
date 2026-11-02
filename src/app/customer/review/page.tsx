import type { Metadata } from 'next';
import { CustomerLayout } from '@/components/layout/customer-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { FeedbackForm } from '@/components/customer/feedback-form';
import { CustomerLandingQuerySchema } from '@/lib/validation/customer-query-schema';
import { isValidExternalUrl } from '@/lib/format/contact-links';

export const metadata: Metadata = {
  title: 'Rate & Review Boutique',
  description: 'Share your shopping experience and generate a natural, AI-assisted review for our clothing boutique.',
};

export const maxDuration = 15;

interface CustomerReviewPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomerReviewPage({ searchParams }: CustomerReviewPageProps) {
  // 1. Resolve and safely validate incoming QR/source query parameters
  const resolvedParams = await searchParams;
  const rawSource = typeof resolvedParams.source === 'string' ? resolvedParams.source : undefined;
  const parsedQuery = CustomerLandingQuerySchema.safeParse({ source: rawSource });
  const validatedSource = parsedQuery.success ? parsedQuery.data.source : undefined;

  // 2. Retrieve ShopSettings from database with safe fallback error state
  let settings;
  try {
    settings = await getShopSettings();
  } catch (error) {
    console.error('Non-fatal: Failed to load shop settings for review page', error);
    settings = {
      shopName: 'Maison & Thread',
      tagline: 'Curated Contemporary Fashion & Bespoke Tailoring',
      logoUrl: null,
      isEmergencyOpen: false,
      googleReviewUrl: null,
    };
  }

  const displayShopName = settings.shopName === 'Pharmacy' ? 'Maison & Thread' : settings.shopName;
  const displayTagline = settings.tagline || 'Curated Contemporary Fashion & Bespoke Tailoring';

  // 3. Strictly validate configured Google Review URL from server settings
  const rawGoogleUrl = settings.googleReviewUrl?.trim();
  const safeGoogleReviewUrl =
    rawGoogleUrl && isValidExternalUrl(rawGoogleUrl) ? rawGoogleUrl : null;

  return (
    <CustomerLayout
      shopName={displayShopName}
      tagline={displayTagline}
      logoUrl={settings.logoUrl}
      isEmergencyOpen={settings.isEmergencyOpen}
    >
      <FeedbackForm
        shopName={displayShopName}
        logoUrl={settings.logoUrl}
        googleReviewUrl={safeGoogleReviewUrl}
        source={validatedSource}
      />
    </CustomerLayout>
  );
}
