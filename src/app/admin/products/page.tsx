import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { listAllProductsAdmin, getProductCategories } from '@/lib/repositories/product-repository';
import { AdminLayout } from '@/components/layout/admin-layout';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { ProductsManager } from '@/components/admin/products-manager';
import { ErrorState } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Products Showcase Management | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  await requireAdmin('/admin/products');

  try {
    const [products, categories, settings] = await Promise.all([
      listAllProductsAdmin(),
      getProductCategories(),
      getShopSettings(),
    ]);

    return (
      <AdminLayout
        title="Products Showcase"
        subtitle="Manage featured clothing items, collections, categories, sizing & pricing."
        shopName={settings?.shopName}
        logoUrl={settings?.logoUrl}
      >
        <ProductsManager initialProducts={products} availableCategories={categories} />
      </AdminLayout>
    );
  } catch (error) {
    console.error('Non-fatal: Failed to load products for admin', error);
    return (
      <AdminLayout
        title="Products Showcase"
        subtitle="Manage featured clothing items, collections, categories, sizing & pricing."
      >
        <div style={{ padding: 'var(--space-6) 0' }}>
          <ErrorState
            title="Unable to load products"
            message="We encountered an issue loading your product showcase. Please try refreshing."
          />
        </div>
      </AdminLayout>
    );
  }
}
