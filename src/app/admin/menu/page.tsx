import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import {
  listAllMenuCategoriesAdmin,
  listAllMenuItemsAdmin,
} from '@/lib/repositories/menu-repository';
import { MenuManager } from '@/components/admin/menu-manager';

export const metadata: Metadata = {
  title: 'Digital Menu Management',
  robots: { index: false, follow: false },
};

export default async function AdminMenuPage() {
  await requireAdmin('/admin/menu');

  const [settings, categories, items] = await Promise.all([
    getShopSettings(),
    listAllMenuCategoriesAdmin(),
    listAllMenuItemsAdmin(),
  ]);

  return (
    <AdminLayout
      title="Digital Menu Management"
      subtitle="Organize culinary categories, curate dishes, manage prices, and control availability"
      shopName={settings?.shopName}
      logoUrl={settings?.logoUrl}
    >
      <MenuManager initialCategories={categories} initialItems={items} />
    </AdminLayout>
  );
}
