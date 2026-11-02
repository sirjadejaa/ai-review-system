import { prisma } from '@/lib/db';
import type { DomainProduct } from '@/lib/domain/types';
import {
  ProductInputSchema,
  type ProductInput,
  DEFAULT_PRODUCT_CATEGORIES,
} from '@/lib/validation/product-schema';

function toDomain(record: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  price: number | null;
  originalPrice: number | null;
  sizes: string;
  colors: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  productUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DomainProduct {
  let sizes: string[] = [];
  try {
    sizes = JSON.parse(record.sizes);
  } catch {
    sizes = [];
  }

  let colors: string[] = [];
  try {
    colors = JSON.parse(record.colors);
  } catch {
    colors = [];
  }

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    imageUrl: record.imageUrl,
    category: record.category,
    price: record.price,
    originalPrice: record.originalPrice,
    sizes,
    colors,
    isFeatured: record.isFeatured,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    productUrl: record.productUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Creates a new clothing store product.
 */
export async function createProduct(input: ProductInput): Promise<DomainProduct> {
  const validated = ProductInputSchema.parse(input);

  const created = await prisma.product.create({
    data: {
      name: validated.name,
      description: validated.description ?? null,
      imageUrl: validated.imageUrl ?? null,
      category: validated.category,
      price: validated.price ?? null,
      originalPrice: validated.originalPrice ?? null,
      sizes: JSON.stringify(validated.sizes ?? []),
      colors: JSON.stringify(validated.colors ?? []),
      isFeatured: validated.isFeatured,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
      productUrl: validated.productUrl ?? null,
    },
  });

  return toDomain(created);
}

/**
 * Retrieves a single product by ID.
 */
export async function getProductById(id: string): Promise<DomainProduct | null> {
  const record = await prisma.product.findUnique({
    where: { id },
  });

  return record ? toDomain(record) : null;
}

/**
 * Lists featured products for customer showcase.
 */
export async function listFeaturedProducts(limit?: number): Promise<DomainProduct[]> {
  const records = await prisma.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
    ...(limit ? { take: limit } : {}),
  });

  return records.map(toDomain);
}

/**
 * Lists active products, optionally filtered by category.
 */
export async function listActiveProducts(category?: string): Promise<DomainProduct[]> {
  const whereClause: { isActive: boolean; category?: string } = {
    isActive: true,
  };

  if (category && category !== 'All') {
    whereClause.category = category;
  }

  const records = await prisma.product.findMany({
    where: whereClause,
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return records.map(toDomain);
}

/**
 * Lists all products for admin console management.
 */
export async function listAllProductsAdmin(): Promise<DomainProduct[]> {
  const records = await prisma.product.findMany({
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return records.map(toDomain);
}

/**
 * Updates an existing product.
 */
export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<DomainProduct | null> {
  const data: Record<string, unknown> = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description ? input.description.trim() : null;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
  if (input.category !== undefined) data.category = input.category.trim();
  if (input.price !== undefined) data.price = input.price;
  if (input.originalPrice !== undefined) data.originalPrice = input.originalPrice;
  if (input.sizes !== undefined) data.sizes = JSON.stringify(input.sizes);
  if (input.colors !== undefined) data.colors = JSON.stringify(input.colors);
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.productUrl !== undefined) data.productUrl = input.productUrl ? input.productUrl.trim() : null;

  try {
    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return toDomain(updated);
  } catch {
    return null;
  }
}

/**
 * Deletes a product permanently.
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves all unique categories present in the database combined with defaults.
 */
export async function getProductCategories(): Promise<string[]> {
  const distinct = await prisma.product.findMany({
    select: { category: true },
    distinct: ['category'],
  });

  const categories = new Set<string>(DEFAULT_PRODUCT_CATEGORIES);
  for (const item of distinct) {
    if (item.category && item.category.trim()) {
      categories.add(item.category.trim());
    }
  }

  return Array.from(categories);
}
