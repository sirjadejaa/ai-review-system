import { prisma } from '@/lib/db';
import type {
  DomainMenuCategory,
  DomainMenuItem,
  MenuItemVariant,
  MenuItemAddon,
} from '@/lib/domain/menu-types';
import {
  MenuCategoryInputSchema,
  MenuItemInputSchema,
  type MenuCategoryInput,
  type MenuItemInput,
} from '@/lib/validation/menu-schema';

function parseJsonArray<T>(str: string | null | undefined, fallback: T[] = []): T[] {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function mapCategoryToDomain(record: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string | null;
    categoryName: string;
    price: number;
    originalPrice: number | null;
    isVeg: boolean;
    dietaryLabels: string;
    spiceLevel: number;
    servingInfo: string | null;
    variants: string;
    addons: string;
    isAvailable: boolean;
    isFeatured: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): DomainMenuCategory {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    icon: record.icon,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    items: record.items ? record.items.map(mapItemToDomain) : undefined,
  };
}

function mapItemToDomain(record: {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string;
  price: number;
  originalPrice: number | null;
  isVeg: boolean;
  dietaryLabels: string;
  spiceLevel: number;
  servingInfo: string | null;
  variants: string;
  addons: string;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): DomainMenuItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    imageUrl: record.imageUrl,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    price: record.price,
    originalPrice: record.originalPrice,
    isVeg: record.isVeg,
    dietaryLabels: parseJsonArray<string>(record.dietaryLabels),
    spiceLevel: record.spiceLevel,
    servingInfo: record.servingInfo,
    variants: parseJsonArray<MenuItemVariant>(record.variants),
    addons: parseJsonArray<MenuItemAddon>(record.addons),
    isAvailable: record.isAvailable,
    isFeatured: record.isFeatured,
    sortOrder: record.sortOrder,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

export async function listMenuCategories(): Promise<DomainMenuCategory[]> {
  await seedDefaultMenuIfEmpty();
  const records = await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });
  return records.map(mapCategoryToDomain);
}

export async function listAllMenuCategoriesAdmin(): Promise<DomainMenuCategory[]> {
  await seedDefaultMenuIfEmpty();
  const records = await prisma.menuCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });
  return records.map(mapCategoryToDomain);
}

export async function getMenuCategoryById(id: string): Promise<DomainMenuCategory | null> {
  const record = await prisma.menuCategory.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      },
    },
  });
  return record ? mapCategoryToDomain(record) : null;
}

export async function createMenuCategory(input: MenuCategoryInput): Promise<DomainMenuCategory> {
  const validated = MenuCategoryInputSchema.parse(input);
  const record = await prisma.menuCategory.create({
    data: {
      name: validated.name,
      description: validated.description ?? null,
      icon: validated.icon ?? null,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder,
    },
  });
  return mapCategoryToDomain(record);
}

export async function updateMenuCategory(id: string, input: Partial<MenuCategoryInput>): Promise<DomainMenuCategory> {
  const record = await prisma.menuCategory.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
  return mapCategoryToDomain(record);
}

export async function deleteMenuCategory(id: string): Promise<boolean> {
  await prisma.menuCategory.delete({ where: { id } });
  return true;
}

export async function reorderMenuCategories(orderedIds: string[]): Promise<boolean> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.menuCategory.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
  return true;
}

// ---------------------------------------------------------------------------
// MENU ITEMS
// ---------------------------------------------------------------------------

export interface MenuItemFilter {
  categoryId?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  search?: string;
}

export async function listMenuItems(filter?: MenuItemFilter): Promise<DomainMenuItem[]> {
  await seedDefaultMenuIfEmpty();

  const where: Record<string, unknown> = {};

  if (filter?.categoryId && filter.categoryId !== 'all') {
    where.categoryId = filter.categoryId;
  }
  if (filter?.isVeg !== undefined) {
    where.isVeg = filter.isVeg;
  }
  if (filter?.isAvailable !== undefined) {
    where.isAvailable = filter.isAvailable;
  }
  if (filter?.isFeatured !== undefined) {
    where.isFeatured = filter.isFeatured;
  }
  if (filter?.search && filter.search.trim().length > 0) {
    const q = filter.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { categoryName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const records = await prisma.menuItem.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return records.map(mapItemToDomain);
}

export async function listAllMenuItemsAdmin(): Promise<DomainMenuItem[]> {
  await seedDefaultMenuIfEmpty();
  const records = await prisma.menuItem.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  return records.map(mapItemToDomain);
}

export async function getMenuItemById(id: string): Promise<DomainMenuItem | null> {
  const record = await prisma.menuItem.findUnique({ where: { id } });
  return record ? mapItemToDomain(record) : null;
}

export async function createMenuItem(input: MenuItemInput): Promise<DomainMenuItem> {
  const validated = MenuItemInputSchema.parse(input);

  let categoryName = validated.categoryName;
  if (validated.categoryId) {
    const cat = await prisma.menuCategory.findUnique({ where: { id: validated.categoryId } });
    if (cat) categoryName = cat.name;
  }

  const record = await prisma.menuItem.create({
    data: {
      name: validated.name,
      description: validated.description ?? null,
      imageUrl: validated.imageUrl ?? null,
      categoryId: validated.categoryId ?? null,
      categoryName,
      price: validated.price,
      originalPrice: validated.originalPrice ?? null,
      isVeg: validated.isVeg,
      dietaryLabels: JSON.stringify(validated.dietaryLabels || []),
      spiceLevel: validated.spiceLevel,
      servingInfo: validated.servingInfo ?? null,
      variants: JSON.stringify(validated.variants || []),
      addons: JSON.stringify(validated.addons || []),
      isAvailable: validated.isAvailable,
      isFeatured: validated.isFeatured,
      sortOrder: validated.sortOrder,
    },
  });

  return mapItemToDomain(record);
}

export async function updateMenuItem(id: string, input: Partial<MenuItemInput>): Promise<DomainMenuItem> {
  const data: Record<string, unknown> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description ?? null;
  if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl ?? null;
  if (input.categoryId !== undefined) {
    data.categoryId = input.categoryId ?? null;
    if (typeof input.categoryId === 'string' && input.categoryId.trim().length > 0) {
      const cat = await prisma.menuCategory.findUnique({ where: { id: input.categoryId } });
      if (cat) data.categoryName = cat.name;
    }
  }
  if (input.categoryName !== undefined && !data.categoryName) data.categoryName = input.categoryName;
  if (input.price !== undefined) data.price = input.price;
  if (input.originalPrice !== undefined) data.originalPrice = input.originalPrice ?? null;
  if (input.isVeg !== undefined) data.isVeg = input.isVeg;
  if (input.dietaryLabels !== undefined) data.dietaryLabels = JSON.stringify(input.dietaryLabels);
  if (input.spiceLevel !== undefined) data.spiceLevel = input.spiceLevel;
  if (input.servingInfo !== undefined) data.servingInfo = input.servingInfo ?? null;
  if (input.variants !== undefined) data.variants = JSON.stringify(input.variants);
  if (input.addons !== undefined) data.addons = JSON.stringify(input.addons);
  if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  const record = await prisma.menuItem.update({
    where: { id },
    data,
  });

  return mapItemToDomain(record);
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  await prisma.menuItem.delete({ where: { id } });
  return true;
}

export async function toggleMenuItemAvailability(id: string): Promise<DomainMenuItem> {
  const current = await prisma.menuItem.findUnique({ where: { id } });
  if (!current) throw new Error('Menu item not found');

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !current.isAvailable },
  });

  return mapItemToDomain(updated);
}

// ---------------------------------------------------------------------------
// REALISTIC RESTAURANT INITIAL SEEDING
// ---------------------------------------------------------------------------

let isSeeding = false;

export async function seedDefaultMenuIfEmpty(): Promise<void> {
  if (isSeeding) return;

  const count = await prisma.menuCategory.count();
  if (count > 0) return;

  isSeeding = true;
  try {
    // 1. Create categories
    const coffeeCat = await prisma.menuCategory.create({
      data: {
        name: 'Artisan Coffee & Brews',
        description: 'Single-origin espresso, pour-overs, and handcrafted cold brews',
        icon: 'Coffee',
        sortOrder: 0,
      },
    });

    const breakfastCat = await prisma.menuCategory.create({
      data: {
        name: 'All-Day Brunch & Bowls',
        description: 'Fresh avocado toasts, sourdough eggs, and nutrient smoothie bowls',
        icon: 'UtensilsCrossed',
        sortOrder: 1,
      },
    });

    const pizzaCat = await prisma.menuCategory.create({
      data: {
        name: 'Wood-Fired Neapolitan Pizza',
        description: '48-hour fermented sourdough crust with San Marzano tomatoes and fior di latte',
        icon: 'Pizza',
        sortOrder: 2,
      },
    });

    const mainsCat = await prisma.menuCategory.create({
      data: {
        name: 'Gourmet Pastas & Mains',
        description: 'Handcrafted pasta, slow-cooked sauces, and seasonal garden mains',
        icon: 'Soup',
        sortOrder: 3,
      },
    });

    const dessertCat = await prisma.menuCategory.create({
      data: {
        name: 'Artisan Bakery & Desserts',
        description: 'Warm tiramisu, sourdough croissants, and seasonal fruit tarts',
        icon: 'Cake',
        sortOrder: 4,
      },
    });

    // 2. Create delicious food items
    const defaultItems: MenuItemInput[] = [
      {
        name: 'Spanish Cortado & Madagascar Vanilla',
        description: 'Double shot of single-origin espresso balanced with silky textured milk and real vanilla bean extract.',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        categoryId: coffeeCat.id,
        categoryName: coffeeCat.name,
        price: 220,
        originalPrice: 260,
        isVeg: true,
        dietaryLabels: ["Chef's Special"],
        spiceLevel: 0,
        servingInfo: '220 ml',
        variants: [
          { name: 'Oat Milk (+₹40)', price: 260 },
          { name: 'Almond Milk (+₹50)', price: 270 },
        ],
        addons: [{ name: 'Extra Espresso Shot', price: 60 }],
        isAvailable: true,
        isFeatured: true,
        sortOrder: 0,
      },
      {
        name: 'Nitro Cold Brew Tonic',
        description: 'Slow cold-dripped Arabica infused with nitrogen, elderflower tonic, and dehydrated blood orange wheel.',
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        categoryId: coffeeCat.id,
        categoryName: coffeeCat.name,
        price: 260,
        originalPrice: null,
        isVeg: true,
        dietaryLabels: ['Vegan', 'Gluten-Free'],
        spiceLevel: 0,
        servingInfo: '320 ml',
        variants: [],
        addons: [],
        isAvailable: true,
        isFeatured: false,
        sortOrder: 1,
      },
      {
        name: 'Sourdough Avocado & Poached Burrata',
        description: 'Toasted seeded rye sourdough, crushed Hass avocado, fresh basil pesto, heirloom cherry tomatoes, and warm runny burrata.',
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        categoryId: breakfastCat.id,
        categoryName: breakfastCat.name,
        price: 390,
        originalPrice: 440,
        isVeg: true,
        dietaryLabels: ["Chef's Special"],
        spiceLevel: 1,
        servingInfo: 'Serves 1-2',
        variants: [],
        addons: [
          { name: 'Grilled Halloumi', price: 90 },
          { name: 'Truffle Oil Drizzle', price: 60 },
        ],
        isAvailable: true,
        isFeatured: true,
        sortOrder: 0,
      },
      {
        name: 'Truffle Wild Mushroom Sourdough Pizza',
        description: 'San Marzano tomato base, roasted shiitake & cremini mushrooms, smoked mozzarella, fresh thyme, and white truffle oil drizzle.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        categoryId: pizzaCat.id,
        categoryName: pizzaCat.name,
        price: 540,
        originalPrice: 590,
        isVeg: true,
        dietaryLabels: ["Chef's Special", 'Vegetarian'],
        spiceLevel: 0,
        servingInfo: '11 inches • 6 slices',
        variants: [
          { name: 'Regular 11"', price: 540 },
          { name: 'Sharing 14"', price: 720 },
        ],
        addons: [
          { name: 'Extra Buffalo Mozzarella', price: 80 },
          { name: 'Garlic Butter Crust Dip', price: 40 },
        ],
        isAvailable: true,
        isFeatured: true,
        sortOrder: 0,
      },
      {
        name: 'Handcrafted Truffle Tagliatelle',
        description: 'Freshly rolled egg tagliatelle tossed in clarified Normandy butter, cracked black pepper, 24-month Parmigiano Reggiano, and black winter truffle.',
        imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
        categoryId: mainsCat.id,
        categoryName: mainsCat.name,
        price: 490,
        originalPrice: null,
        isVeg: true,
        dietaryLabels: ['Vegetarian'],
        spiceLevel: 1,
        servingInfo: 'Serves 1',
        variants: [],
        addons: [{ name: 'Shaved Fresh Truffle', price: 120 }],
        isAvailable: true,
        isFeatured: true,
        sortOrder: 0,
      },
      {
        name: 'Classic Espresso Tiramisu Al Forno',
        description: 'Savoiardi ladyfingers soaked in our signature house espresso and Marsala, layered with whipped mascarpone cream and Valrhona Dutch cocoa.',
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
        categoryId: dessertCat.id,
        categoryName: dessertCat.name,
        price: 320,
        originalPrice: 360,
        isVeg: true,
        dietaryLabels: ["Chef's Special"],
        spiceLevel: 0,
        servingInfo: 'Single Serving',
        variants: [],
        addons: [],
        isAvailable: true,
        isFeatured: true,
        sortOrder: 0,
      },
    ];

    for (const item of defaultItems) {
      await createMenuItem(item);
    }
  } catch (err) {
    console.error('Failed to seed default restaurant menu:', err);
  } finally {
    isSeeding = false;
  }
}
