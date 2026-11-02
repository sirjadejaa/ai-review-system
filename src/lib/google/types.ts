/**
 * Google Business Profile API & OAuth 2.0 Types
 * Scopes: https://www.googleapis.com/auth/business.manage
 */

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleBusinessAccountItem {
  name: string; // e.g. "accounts/1029384756..."
  accountName: string; // e.g. "Maison & Thread Boutique"
  type: string;
  verificationState?: string;
}

export interface GoogleLocationItem {
  name: string; // e.g. "locations/987654321..."
  title: string; // Store display name
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
}

export interface GoogleReviewComment {
  comment?: string;
}

export interface GoogleReviewReplyPayload {
  comment: string;
}

export interface GoogleReviewReplyResponse {
  comment: string;
  updateTime: string;
}

export interface GoogleReviewItemFromApi {
  name: string; // "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
    isAnonymous?: boolean;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleListReviewsResponse {
  reviews?: GoogleReviewItemFromApi[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}

export interface GoogleConnectionStatus {
  isConfigured: boolean; // Are CLIENT_ID & CLIENT_SECRET set in env?
  isConnected: boolean; // Has store owner connected an account?
  accountName?: string | null;
  locationName?: string | null;
  locationId?: string | null;
  lastSyncAt?: Date | null;
  lastSyncError?: string | null;
}

export interface GoogleReviewStats {
  totalSynced: number;
  repliedCount: number;
  unrepliedCount: number;
  averageRating: number;
  replyCoveragePercentage: number;
  aiDraftsGenerated: number;
  publishedReplies: number;
}
