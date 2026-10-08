import { prisma } from '@/lib/db';
import type { DomainShopSettings, OpeningHourSlot } from '@/lib/domain/types';
import { ShopSettingsInputSchema, type ShopSettingsInput } from '@/lib/validation/shop-settings-schema';

const DEFAULT_SHOP_ID = 'default_shop';

const DEFAULT_INITIAL_SETTINGS: DomainShopSettings = {
  id: DEFAULT_SHOP_ID,
  shopName: 'Pharmacy',
  tagline: null,
  logoUrl: null,
  phoneNumber: null,
  whatsappNumber: null,
  address: null,
  googleMapsUrl: null,
  googleReviewUrl: null,
  openingHours: [],
  isEmergencyOpen: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function toDomain(record: {
  id: string;
  shopName: string;
  tagline: string | null;
  logoUrl?: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  googleReviewUrl: string | null;
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

  return {
    id: record.id,
    shopName: record.shopName,
    tagline: record.tagline,
    logoUrl: record.logoUrl ?? null,
    phoneNumber: record.phoneNumber,
    whatsappNumber: record.whatsappNumber,
    address: record.address,
    googleMapsUrl: record.googleMapsUrl,
    googleReviewUrl: record.googleReviewUrl,
    openingHours,
    isEmergencyOpen: record.isEmergencyOpen,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Retrieves the single medical shop settings.
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
      phoneNumber: DEFAULT_INITIAL_SETTINGS.phoneNumber,
      whatsappNumber: DEFAULT_INITIAL_SETTINGS.whatsappNumber,
      address: DEFAULT_INITIAL_SETTINGS.address,
      googleMapsUrl: DEFAULT_INITIAL_SETTINGS.googleMapsUrl,
      googleReviewUrl: DEFAULT_INITIAL_SETTINGS.googleReviewUrl,
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
      phoneNumber: validated.phoneNumber ?? null,
      whatsappNumber: validated.whatsappNumber ?? null,
      address: validated.address ?? null,
      googleMapsUrl: validated.googleMapsUrl || null,
      googleReviewUrl: validated.googleReviewUrl || null,
      openingHours: JSON.stringify(validated.openingHours),
      isEmergencyOpen: validated.isEmergencyOpen,
    },
    create: {
      id: DEFAULT_SHOP_ID,
      shopName: validated.shopName,
      tagline: validated.tagline ?? null,
      logoUrl: validated.logoUrl ?? null,
      phoneNumber: validated.phoneNumber ?? null,
      whatsappNumber: validated.whatsappNumber ?? null,
      address: validated.address ?? null,
      googleMapsUrl: validated.googleMapsUrl || null,
      googleReviewUrl: validated.googleReviewUrl || null,
      openingHours: JSON.stringify(validated.openingHours),
      isEmergencyOpen: validated.isEmergencyOpen,
    },
  });

  return toDomain(updated);
}
