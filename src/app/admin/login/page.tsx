import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdmin, sanitizeReturnUrl } from '@/lib/auth';
import { getShopSettings } from '@/lib/repositories/shop-settings-repository';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  robots: { index: false, follow: false },
};

interface AdminLoginPageProps {
  searchParams?: Promise<{ returnUrl?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  // If already authenticated, redirect immediately to dashboard
  const currentAdmin = await getCurrentAdmin();
  if (currentAdmin) {
    redirect('/admin');
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const returnUrl = sanitizeReturnUrl(resolvedParams?.returnUrl);

  let shopName = 'Pharmacy';
  let logoUrl: string | null = null;
  try {
    const settings = await getShopSettings();
    if (settings.shopName) shopName = settings.shopName;
    if (settings.logoUrl) logoUrl = settings.logoUrl;
  } catch {
    // Graceful fallback
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-app)',
      }}
    >
      <LoginForm returnUrl={returnUrl} shopName={shopName} logoUrl={logoUrl} />
    </div>
  );
}

