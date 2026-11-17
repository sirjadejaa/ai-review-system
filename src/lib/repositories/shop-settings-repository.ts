import { prisma } from '@/lib/db';
import type { DomainShopSettings, OpeningHourSlot } from '@/lib/domain/types';
import { ShopSettingsInputSchema, type ShopSettingsInput } from '@/lib/validation/shop-settings-schema';

const DEFAULT_SHOP_ID = 'default_shop';

const DEFAULT_INITIAL_SETTINGS: DomainShopSettings = {
  id: DEFAULT_SHOP_ID,
  shopName: 'The Olive & Hearth',
  tagline: 'Artisanal Kitchen, Specialty Coffee & Wood-Fired Delicacies',
  logoUrl: null,
  coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  restaurantType: 'Café & Restaurant',
  cuisineTypes: ['Artisanal Pizza', 'Specialty Coffee', 'Continental', 'Desserts'],
  primaryColor: '#25221F',
  secondaryColor: '#57483D',
  accentColor: '#B78348',
  phoneNumber: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  emergencyContact: null,
  address: 'Shop 4, Heritage Galleria, Near Central Park, Ahmedabad, Gujarat',
  googleMapsUrl: 'https://maps.google.com',
  googleReviewUrl: 'https://search.google.com/local/writereview',
  websiteUrl: null,
  socialLinks: [],
  openingHours: [
    { days: 'Mon - Fri', hours: '11:00 AM - 11:00 PM' },
    { days: 'Sat - Sun', hours: '10:00 AM - 11:30 PM' },
  ],
  isEmergencyOpen: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function toDomain(record: {
  id: string;
  shopName: string;
  tagline: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  restaurantType?: string | null;
  cuisineTypes?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  emergencyContact?: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  googleReviewUrl: string | null;
  websiteUrl?: string | null;
  socialLinks?: string | null;
  openingHours: string;
  isEmergencyOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DomainShopSettings {
  let openingHours: OpeningHourSlot[] = [];
  try {
    openingHours = JSON.parse(record.openingHours);
  } catch {
    openingHours = [];
  }

  let socialLinks: string[] = [];
  try {
    socialLinks = record.socialLinks ? JSON.parse(record.socialLinks) : [];
  } catch {
    socialLinks = [];
  }

  let cuisineTypes: string[] = [];
  try {
    cuisineTypes = record.cuisineTypes ? JSON.parse(record.cuisineTypes) : [];
  } catch {
    cuisineTypes = [];
  }

  return {
    id: record.id,
    shopName: record.shopName,
    tagline: record.tagline,
    logoUrl: record.logoUrl ?? null,
    coverImageUrl: record.coverImageUrl ?? null,
    restaurantType: record.restaurantType ?? 'Café & Restaurant',
    cuisineTypes,
    primaryColor: record.primaryColor ?? '#25221F',
    secondaryColor: record.secondaryColor ?? '#57483D',
    accentColor: record.accentColor ?? '#B78348',
    phoneNumber: record.phoneNumber,
    whatsappNumber: record.whatsappNumber,
    emergencyContact: record.emergencyContact ?? null,
    address: record.address,
    googleMapsUrl: record.googleMapsUrl,
    googleReviewUrl: record.googleReviewUrl,
    websiteUrl: record.websiteUrl ?? null,
    socialLinks,
    openingHours,
    isEmergencyOpen: record.isEmergencyOpen,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Retrieves the single restaurant settings.
 * If no record exists yet, safely bootstraps clean initial settings (singleton constraint).
 */
export async function getShopSettings(): Promise<DomainShopSettings> {
  const existing = await prisma.shopSettings.findUnique({
    where: { id: DEFAULT_SHOP_ID },
  });

  if (existing) {
    return toDomain(existing);
  }

  // Self-heal / Bootstrap initial settings
  const created = await prisma.shopSettings.create({
    data: {
      id: DEFAULT_SHOP_ID,
      shopName: DEFAULT_INITIAL_SETTINGS.shopName,
      tagline: DEFAULT_INITIAL_SETTINGS.tagline,
      logoUrl: DEFAULT_INITIAL_SETTINGS.logoUrl,
      coverImageUrl: DEFAULT_INITIAL_SETTINGS.coverImageUrl,
      restaurantType: DEFAULT_INITIAL_SETTINGS.restaurantType,
      cuisineTypes: JSON.stringify(DEFAULT_INITIAL_SETTINGS.cuisineTypes),
      primaryColor: DEFAULT_INITIAL_SETTINGS.primaryColor,
      secondaryColor: DEFAULT_INITIAL_SETTINGS.secondaryColor,
      accentColor: DEFAULT_INITIAL_SETTINGS.accentColor,
      phoneNumber: DEFAULT_INITIAL_SETTINGS.phoneNumber,
      whatsappNumber: DEFAULT_INITIAL_SETTINGS.whatsappNumber,
      emergencyContact: DEFAULT_INITIAL_SETTINGS.emergencyContact,
      address: DEFAULT_INITIAL_SETTINGS.address,
      googleMapsUrl: DEFAULT_INITIAL_SETTINGS.googleMapsUrl,
      googleReviewUrl: DEFAULT_INITIAL_SETTINGS.googleReviewUrl,
      websiteUrl: DEFAULT_INITIAL_SETTINGS.websiteUrl,
      socialLinks: JSON.stringify(DEFAULT_INITIAL_SETTINGS.socialLinks),
      openingHours: JSON.stringify(DEFAULT_INITIAL_SETTINGS.openingHours),
      isEmergencyOpen: DEFAULT_INITIAL_SETTINGS.isEmergencyOpen,
    },
  });

  return toDomain(created);
}

/**
 * Updates the single shop settings with validation.
 */
export async function updateShopSettings(input: ShopSettingsInput): Promise<DomainShopSettings> {
  const validated = ShopSettingsInputSchema.parse(input);

  const updated = await prisma.shopSettings.upsert({
    where: { id: DEFAULT_SHOP_ID },
    update: {
      shopName: validated.shopName,
      tagline: validated.tagline ?? null,
      logoUrl: validated.logoUrl ?? null,
      coverImageUrl: validated.coverImageUrl ?? null,
      restaurantType: validated.restaurantType ?? 'Café & Restaurant',
      cuisineTypes: JSON.stringify(validated.cuisineTypes || []),
      primaryColor: validated.primaryColor ?? '#25221F',
      secondaryColor: validated.secondaryColor ?? '#57483D',
      accentColor: validated.accentColor ?? '#B78348',
      phoneNumber: validated.phoneNumber ?? null,
      whatsappNumber: validated.whatsappNumber ?? null,
      emergencyContact: validated.emergencyContact ?? null,
      address: validated.address ?? null,
      googleMapsUrl: validated.googleMapsUrl || null,
      googleReviewUrl: validated.googleReviewUrl || null,
      websiteUrl: validated.websiteUrl || null,
      socialLinks: JSON.stringify(validated.socialLinks || []),
      openingHours: JSON.stringify(validated.openingHours),
      isEmergencyOpen: validated.isEmergencyOpen,
    },
    create: {
      id: DEFAULT_SHOP_ID,
      shopName: validated.shopName,
      tagline: validated.tagline ?? null,
      logoUrl: validated.logoUrl ?? null,
      coverImageUrl: validated.coverImageUrl ?? null,
      restaurantType: validated.restaurantType ?? 'Café & Restaurant',
      cuisineTypes: JSON.stringify(validated.cuisineTypes || []),
      primaryColor: validated.primaryColor ?? '#25221F',
      secondaryColor: validated.secondaryColor ?? '#57483D',
      accentColor: validated.accentColor ?? '#B78348',
      phoneNumber: validated.phoneNumber ?? null,
      whatsappNumber: validated.whatsappNumber ?? null,
      emergencyContact: validated.emergencyContact ?? null,
      address: validated.address ?? null,
      googleMapsUrl: validated.googleMapsUrl || null,
      googleReviewUrl: validated.googleReviewUrl || null,
      websiteUrl: validated.websiteUrl || null,
      socialLinks: JSON.stringify(validated.socialLinks || []),
      openingHours: JSON.stringify(validated.openingHours),
      isEmergencyOpen: validated.isEmergencyOpen,
    },
  });

  return toDomain(updated);
}
