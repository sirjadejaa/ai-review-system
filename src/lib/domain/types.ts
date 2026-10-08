/**
 * Core Domain Types
 * Single Medical Shop / Pharmacy AI Review & Digital Customer Card System
 */

export interface OpeningHourSlot {
  days: string;
  hours: string;
}

export interface DomainShopSettings {
  id: string;
  shopName: string;
  tagline: string | null;
  logoUrl: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  googleReviewUrl: string | null;
  openingHours: OpeningHourSlot[];
  isEmergencyOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackStatus = 'NEW' | 'REVIEWED' | 'RESOLVED';

export interface DomainFeedback {
  id: string;
  rating: number; // 1 to 5
  tags: string[];
  notes: string | null;
  customerContact: string | null;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainOffer {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  validUntil: Date | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AnalyticsEventType =
  | 'QR_SCAN'
  | 'GOOGLE_REVIEW_CLICK'
  | 'CALL_CLICK'
  | 'WHATSAPP_CLICK'
  | 'DIRECTIONS_CLICK';

export interface DomainAnalyticsEvent {
  id: string;
  eventType: AnalyticsEventType;
  source: string | null;
  createdAt: Date;
}

export interface DomainAdminUser {
  id: string;
  username: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
