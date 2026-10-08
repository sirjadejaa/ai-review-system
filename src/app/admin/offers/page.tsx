import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { listAllOffers } from '@/lib/repositories/offer-repository';
import { AdminLayout } from '@/components/layout/admin-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { OffersManager } from '@/components/admin/offers-manager';
import { ErrorState } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Store Offers & Discounts',
  robots: { index: false, follow: false },
};

export default async function AdminOffersPage() {
  await requireAdmin('/admin/offers');

  try {
    const [offers, settings] = await Promise.all([
      listAllOffers(),
      getShopSettings(),
    ]);

    return (
      <AdminLayout
        title="Promotional Offers"
        subtitle="Manage offers shown to pharmacy customers."
        shopName={settings?.shopName}
        logoUrl={settings?.logoUrl}
      >
        <OffersManager initialOffers={offers} />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Non-fatal: Failed to load offers for admin', error);
    return (
      <AdminLayout
        title="Promotional Offers"
        subtitle="Manage offers shown to pharmacy customers."
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load store offers"
            message="We encountered an issue loading your offers. Please try refreshing."
          />
        </div>
      </AdminLayout>
    );
  }
}

