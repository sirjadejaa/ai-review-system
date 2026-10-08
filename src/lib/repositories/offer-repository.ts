import { prisma } from '@/lib/db';
import type { DomainOffer } from '@/lib/domain/types';
import {
  CreateOfferInputSchema,
  UpdateOfferInputSchema,
  type CreateOfferInput,
  type UpdateOfferInput,
} from '@/lib/validation/offer-schema';

function toDomain(record: {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  validUntil: Date | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): DomainOffer {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    badge: record.badge,
    validUntil: record.validUntil,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Creates a new store promotional offer.
 */
export async function createOffer(input: CreateOfferInput): Promise<DomainOffer> {
  const validated = CreateOfferInputSchema.parse(input);

  const created = await prisma.offer.create({
    data: {
      title: validated.title,
      description: validated.description ?? null,
      badge: validated.badge ?? null,
      validUntil: validated.validUntil ?? null,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
    },
  });

  return toDomain(created);
}

/**
 * Retrieves an offer by ID.
 */
export async function getOfferById(id: string): Promise<DomainOffer | null> {
  const record = await prisma.offer.findUnique({
    where: { id },
  });

  return record ? toDomain(record) : null;
}

/**
 * Lists active offers suitable for the customer digital card.
 * Filters out expired offers and inactive offers. Sorted by sortOrder asc, createdAt desc.
 */
export async function listActiveOffers(): Promise<DomainOffer[]> {
  const now = new Date();

  const records = await prisma.offer.findMany({
    where: {
      isActive: true,
      OR: [
        { validUntil: null },
        { validUntil: { gte: now } },
      ],
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return records.map(toDomain);
}

/**
 * Lists all offers for admin management.
 */
export async function listAllOffers(): Promise<DomainOffer[]> {
  const records = await prisma.offer.findMany({
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return records.map(toDomain);
}

/**
 * Updates an existing offer.
 */
export async function updateOffer(id: string, input: UpdateOfferInput): Promise<DomainOffer | null> {
  const validated = UpdateOfferInputSchema.parse(input);

  const data: Record<string, unknown> = {};
  if (validated.title !== undefined) data.title = validated.title;
  if (validated.description !== undefined) data.description = validated.description;
  if (validated.badge !== undefined) data.badge = validated.badge;
  if (validated.validUntil !== undefined) data.validUntil = validated.validUntil;
  if (validated.isActive !== undefined) data.isActive = validated.isActive;
  if (validated.sortOrder !== undefined) data.sortOrder = validated.sortOrder;

  try {
    const updated = await prisma.offer.update({
      where: { id },
      data,
    });

    return toDomain(updated);
  } catch {
    return null;
  }
}

/**
 * Deletes an offer by ID.
 */
export async function deleteOffer(id: string): Promise<boolean> {
  try {
    await prisma.offer.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
