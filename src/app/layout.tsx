import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { BrandThemeStyle } from '@/components/brand/brand-theme-style';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getShopSettings();
    const shopName = settings.shopName || 'Pharmacy';
    const tagline = settings.tagline || 'Healthcare & Genuine Medicines';
    return {
      title: {
        default: `${shopName} — ${tagline}`,
        template: `%s | ${shopName}`,
      },
      description: `Customer review and digital pharmacy pass platform for ${shopName}.`,
    };
  } catch {
    return {
      title: {
        default: 'Pharmacy — Healthcare & Genuine Medicines',
        template: '%s | Pharmacy',
      },
      description: 'Customer review and digital pharmacy card platform for our independent pharmacy.',
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    settings = await getShopSettings();
  } catch {
    // Graceful fallback to default theme tokens
  }

  return (
    <html lang="en">
      <head>
        <BrandThemeStyle
          primaryColor={settings?.primaryColor}
          secondaryColor={settings?.secondaryColor}
          accentColor={settings?.accentColor}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

