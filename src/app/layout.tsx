import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { BrandThemeStyle } from '@/components/brand/brand-theme-style';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: 'Maison & Thread — Luxury Clothing Boutique & Customer Experience',
    template: '%s | Maison & Thread',
  },
  description: 'Share your shopping experience and access your digital boutique privilege card with curated seasonal collections.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    settings = await getShopSettings();
  } catch {
    // Non-fatal: fallback to default tokens
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {settings && (
          <BrandThemeStyle
            primaryColor={settings.primaryColor}
            secondaryColor={settings.secondaryColor}
            accentColor={settings.accentColor}
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
