import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/context';
import {
  exchangeCodeForTokens,
  fetchGoogleAccounts,
  fetchGoogleLocations,
} from '@/lib/google/client';
import {
  saveGoogleConnection,
  syncGoogleReviewsFromApi,
} from '@/lib/repositories/google-review-repository';

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle user cancellation or denial
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/google-reviews?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // 1. Strictly require authenticated store admin
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 2. Validate CSRF state token
  const storedState = request.cookies.get('google_oauth_state')?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL('/admin/google-reviews?error=invalid_csrf_state', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/google-reviews?error=missing_code', request.url)
    );
  }

  try {
    // 3. Exchange code for access & refresh tokens
    const tokens = await exchangeCodeForTokens(code);

    // 4. Retrieve associated Google Business Accounts and Locations
    const accounts = await fetchGoogleAccounts(tokens.access_token);
    let accountId = 'default_account';
    let accountName = 'Google Business Account';
    let locationId = 'default_location';
    let locationName = 'Main Boutique Store';

    if (accounts.length > 0) {
      const primaryAccount = accounts[0];
      accountId = primaryAccount.name;
      accountName = primaryAccount.accountName || primaryAccount.name;

      const locations = await fetchGoogleLocations(tokens.access_token, primaryAccount.name);
      if (locations.length > 0) {
        locationId = locations[0].name;
        locationName = locations[0].title || locations[0].name;
      }
    }

    // 5. Encrypt tokens at rest and save connection in database
    await saveGoogleConnection({
      accountId,
      accountName,
      locationId,
      locationName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: tokens.expires_in || 3600,
      scopes: tokens.scope,
    });

    // 6. Trigger initial review synchronization in background
    void syncGoogleReviewsFromApi().catch((err) => {
      console.error('Non-fatal: Initial Google review sync failed:', err);
    });

    const response = NextResponse.redirect(
      new URL('/admin/google-reviews?connected=true', request.url)
    );
    // Clear CSRF state cookie
    response.cookies.delete('google_oauth_state');
    return response;
  } catch (err) {
    console.error('Google OAuth callback processing error:', err);
    const msg = err instanceof Error ? err.message : 'oauth_failed';
    return NextResponse.redirect(
      new URL(`/admin/google-reviews?error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
