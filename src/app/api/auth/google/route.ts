import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentAdmin } from '@/lib/auth/context';
import { isGoogleOAuthConfigured, generateGoogleAuthUrl } from '@/lib/google/client';

export async function GET(request: NextRequest) {
  // 1. Strictly require authenticated store admin
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // 2. Verify Google OAuth configuration
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL('/admin/google-reviews?error=oauth_unconfigured', request.url)
    );
  }

  // 3. Generate CSRF state token and store in HttpOnly cookie
  const state = crypto.randomBytes(24).toString('hex');
  const authUrl = generateGoogleAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
