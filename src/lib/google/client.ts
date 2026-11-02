import type {
  GoogleOAuthConfig,
  GoogleOAuthTokenResponse,
  GoogleBusinessAccountItem,
  GoogleLocationItem,
  GoogleListReviewsResponse,
  GoogleReviewReplyResponse,
} from './types';

export const GOOGLE_BUSINESS_SCOPE = 'https://www.googleapis.com/auth/business.manage';

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri =
    (process.env.GOOGLE_REDIRECT_URI || '').trim() || `${appUrl}/api/auth/google/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthConfigured(): boolean {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  return Boolean(
    clientId &&
      clientSecret &&
      clientId !== 'your-google-client-id' &&
      clientSecret !== 'your-google-client-secret'
  );
}

/**
 * Generates the Google OAuth 2.0 Authorization URL requesting business profile management.
 */
export function generateGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is missing.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_BUSINESS_SCOPE,
    access_type: 'offline',
    prompt: 'consent', // Force consent so Google always returns refresh_token
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges an OAuth 2.0 authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google token exchange error:', response.status, errorBody);
    throw new Error(`Google token exchange failed: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Refreshes an expired access token using the stored refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getGoogleOAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google token refresh error:', response.status, errorBody);
    throw new Error(`Google token refresh failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Lists the Google Business Accounts associated with the connected profile.
 */
export async function fetchGoogleAccounts(accessToken: string): Promise<GoogleBusinessAccountItem[]> {
  const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Fetch Google Accounts error:', response.status, errorBody);
    throw new Error(`Failed to fetch Google Accounts: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Lists the Locations under a specific Google Business Account.
 */
export async function fetchGoogleLocations(
  accessToken: string,
  accountName: string
): Promise<GoogleLocationItem[]> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Fetch Google Locations error:', response.status, errorBody);
    throw new Error(`Failed to fetch Google Locations: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.locations || [];
}

/**
 * Lists reviews for a specific Business Profile Location.
 */
export async function fetchGoogleReviews(
  accessToken: string,
  locationResourceName: string,
  pageSize = 50,
  pageToken?: string
): Promise<GoogleListReviewsResponse> {
  const query = new URLSearchParams({
    pageSize: String(pageSize),
  });
  if (pageToken) {
    query.set('pageToken', pageToken);
  }

  const url = `https://mybusiness.googleapis.com/v4/${locationResourceName}/reviews?${query.toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Fetch Google Reviews error:', response.status, errorBody);
    throw new Error(`Failed to fetch Google Reviews: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Publishes an owner reply to a Google Business Profile review.
 * Google API requires PUT to: accounts/{acc}/locations/{loc}/reviews/{rev}/reply
 */
export async function publishGoogleReviewReply(
  accessToken: string,
  reviewResourceName: string,
  replyComment: string
): Promise<GoogleReviewReplyResponse> {
  const url = `https://mybusiness.googleapis.com/v4/${reviewResourceName}/reply`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ comment: replyComment }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Publish Google Review Reply error:', response.status, errorBody);
    throw new Error(`Failed to publish Google reply: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Deletes an owner reply from a review.
 */
export async function deleteGoogleReviewReply(
  accessToken: string,
  reviewResourceName: string
): Promise<void> {
  const url = `https://mybusiness.googleapis.com/v4/${reviewResourceName}/reply`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Delete Google Review Reply error:', response.status, errorBody);
    throw new Error(`Failed to delete Google reply: HTTP ${response.status}`);
  }
}
