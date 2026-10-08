/**
 * Core Domain Types for Single Medical Shop Review & Customer Card System
 * Strictly single-tenant. No SaaS or multi-tenancy constructs.
 */

export type LanguageCode = 'en' | 'hi' | 'hinglish';

export interface ShopSettings {
  shopName: string;
  tagline?: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  googleMapsUrl: string;
  googleReviewUrl: string;
  openingHours: {
    days: string;
    hours: string;
  }[];
  emergencyAvailable?: boolean;
}

export interface ReviewDraftInput {
  rating: number; // 1 to 5
  tags: string[]; // e.g., ['Fast service', 'Polite staff', 'Medicines in stock']
  userNotes?: string;
  language: LanguageCode;
}

export interface AIReviewSuggestion {
  id: string;
  text: string;
  language: LanguageCode;
}

export interface InternalFeedback {
  id: string;
  rating: number;
  tags: string[];
  notes?: string;
  customerContact?: string; // Optional phone/email only if customer voluntarily provides
  createdAt: string;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  badge?: string;
  validUntil?: string;
  isActive: boolean;
}

export interface QRAnalyticsEvent {
  id: string;
  eventType: 'qr_scan' | 'google_review_click' | 'whatsapp_click' | 'call_click' | 'directions_click';
  source?: string;
  timestamp: string;
}
