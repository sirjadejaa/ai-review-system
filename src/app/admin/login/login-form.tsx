'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Button,
} from '@/components/ui';
import { BoutiqueLogo } from '@/components/brand/boutique-logo';
import { loginAction, type LoginActionState } from '@/lib/auth/actions';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginFormProps {
  returnUrl?: string;
  shopName?: string;
  logoUrl?: string | null;
}

export function LoginForm({ returnUrl = '/admin', shopName = 'Maison & Thread', logoUrl }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<LoginActionState | null, FormData>(
    loginAction,
    null
  );

  const displayShopName = shopName === 'Pharmacy' ? 'Maison & Thread' : shopName;

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
      {/* Centered Brand & Logo */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <BoutiqueLogo
            logoUrl={logoUrl}
            shopName={displayShopName}
            variant="mark"
            size="lg"
          />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 600,
            color: 'var(--color-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {displayShopName}
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-accent)',
            margin: 'var(--space-1) 0 0',
            fontWeight: 'var(--font-weight-semibold)',
          }}
        >
          Boutique Management Console
        </p>
      </div>

      <Card>
        <CardHeader style={{ textAlign: 'center' }}>
          <CardTitle as="h1" style={{ fontSize: 'var(--font-size-xl)' }}>
            Welcome Back
          </CardTitle>
          <CardDescription>
            Secure access for boutique owner &amp; store managers
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state?.error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger-text)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <Input
              label="Username"
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Store Owner"
              disabled={isPending}
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              disabled={isPending}
            />

            <div style={{ marginTop: 'var(--space-2)' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isPending}
              >
                Sign In to Boutique Console
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter style={{ borderTop: '1px solid var(--color-border)', justifyContent: 'center' }}>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
            Session authenticated with cryptographic cookie verification
          </p>
        </CardFooter>
      </Card>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
        <Link
          href="/"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Return to Store Experience</span>
        </Link>
      </div>
    </div>
  );
}
