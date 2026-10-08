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
import { PharmacyLogo } from '@/components/brand/pharmacy-logo';
import { loginAction, type LoginActionState } from '@/lib/auth/actions';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginFormProps {
  returnUrl?: string;
  shopName?: string;
  logoUrl?: string | null;
}

export function LoginForm({ returnUrl = '/admin', shopName = 'Arogya Pharmacy', logoUrl }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<LoginActionState | null, FormData>(
    loginAction,
    null
  );

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
      {/* Centered Brand & Logo */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <PharmacyLogo
            logoUrl={logoUrl}
            shopName={shopName}
            variant="mark"
            size="lg"
          />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 500,
            color: 'var(--color-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {shopName}
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-secondary)',
            margin: 'var(--space-1) 0 0',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          Management Console
        </p>
      </div>

      <Card>
        <CardHeader style={{ textAlign: 'center' }}>
          <CardTitle as="h1" style={{ fontSize: 'var(--font-size-xl)' }}>
            Welcome Back
          </CardTitle>
          <CardDescription>
            Secure access for pharmacy management
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state?.error && (
            <div
              role="alert"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-text)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <input type="hidden" name="returnUrl" value={returnUrl} />

            <Input
              id="admin-username"
              name="username"
              label="Username"
              type="text"
              placeholder="Enter username"
              required
              autoComplete="username"
              disabled={isPending}
            />

            <Input
              id="admin-password"
              name="password"
              label="Password"
              type="password"
              placeholder="Enter password"
              required
              autoComplete="current-password"
              disabled={isPending}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isPending}
            >
              Login
            </Button>
          </form>
        </CardContent>

        <CardFooter style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            Better Health. Brighter Tomorrow.
          </p>
          <Link
            href="/"
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 'var(--font-weight-medium)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
            }}
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Back to Customer Experience</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
