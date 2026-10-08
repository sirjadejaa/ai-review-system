import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { AdminLayout } from '@/components/layout/admin-layout';
import { SettingsManager } from '@/components/admin/settings-manager';
import { ErrorState } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Pharmacy Information & Settings',
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdmin('/admin/settings');

  try {
    const settings = await getShopSettings();

    return (
      <AdminLayout
        title="Pharmacy Settings"
        subtitle="Manage your pharmacy identity and preferences."
      >
        <SettingsManager initialSettings={settings} />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Non-fatal: Failed to load settings for admin', error);
    return (
      <AdminLayout
        title="Pharmacy Settings"
        subtitle="Manage your pharmacy identity and preferences."
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load pharmacy settings"
            message="We encountered an issue loading your settings. Please try refreshing."
          />
        </div>
      </AdminLayout>
    );
  }
}

