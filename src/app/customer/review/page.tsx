import type { Metadata } from 'next';
import { CustomerLayout } from '@/components/layout/customer-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { FeedbackForm } from '@/components/customer/feedback-form';
import { CustomerLandingQuerySchema } from '@/lib/validation/customer-query-schema';
import { isValidExternalUrl } from '@/lib/format/contact-links';

export const metadata: Metadata = {
  title: 'Give a Review & Feedback',
  description: 'Share your visit feedback and compose an AI-assisted Google review for our pharmacy.',
};

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
      shopName: 'Pharmacy',
      tagline: null,
      logoUrl: null,
      isEmergencyOpen: false,
      googleReviewUrl: null,
    };
  }

  // 3. Strictly validate configured Google Review URL from server settings
  const rawGoogleUrl = settings.googleReviewUrl?.trim();
  const safeGoogleReviewUrl =
    rawGoogleUrl && isValidExternalUrl(rawGoogleUrl) ? rawGoogleUrl : null;

  return (
    <CustomerLayout
      shopName={settings.shopName}
      tagline={settings.tagline ?? undefined}
      logoUrl={settings.logoUrl}
      isEmergencyOpen={settings.isEmergencyOpen}
    >
      <FeedbackForm
        shopName={settings.shopName}
        logoUrl={settings.logoUrl}
        googleReviewUrl={safeGoogleReviewUrl}
        source={validatedSource}
      />
    </CustomerLayout>
  );
}
