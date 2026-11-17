import { describe, it, expect } from 'vitest';
import {
  MenuCategoryInputSchema,
  MenuItemInputSchema,
} from '@/lib/validation/menu-schema';

describe('Digital Restaurant & Café Menu Validation', () => {
  describe('MenuCategoryInputSchema', () => {
    it('validates a valid restaurant category input', () => {
      const valid = MenuCategoryInputSchema.safeParse({
        name: 'Wood-Fired Pizza',
        description: 'Authentic 48-hour fermented sourdough Neapolitan pizzas',
        icon: 'Pizza',
        isActive: true,
        sortOrder: 0,
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.name).toBe('Wood-Fired Pizza');
        expect(valid.data.isActive).toBe(true);
      }
    });

    it('rejects empty category name', () => {
      const invalid = MenuCategoryInputSchema.safeParse({
        name: '   ',
      });

      expect(invalid.success).toBe(false);
    });
  });

  describe('MenuItemInputSchema', () => {
    it('validates a complete vegetarian culinary dish with variants and add-ons', () => {
      const valid = MenuItemInputSchema.safeParse({
        name: 'Truffle Wild Mushroom Pizza',
        description: 'San Marzano base, mozzarella, roasted shiitake, white truffle drizzle',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
        categoryId: 'cat-123',
        categoryName: 'Wood-Fired Pizza',
        price: 540,
        originalPrice: 590,
        isVeg: true,
        dietaryLabels: ["Chef's Special", 'Vegetarian'],
        spiceLevel: 1,
        servingInfo: '11 inches • 6 slices',
        variants: [
          { name: 'Regular 11"', price: 540 },
          { name: 'Large 14"', price: 720 },
        ],
        addons: [
          { name: 'Extra Mozzarella', price: 80 },
          { name: 'Garlic Crust Dip', price: 40 },
        ],
        isAvailable: true,
        isFeatured: true,
        sortOrder: 0,
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.isVeg).toBe(true);
        expect(valid.data.spiceLevel).toBe(1);
        expect(valid.data.variants).toHaveLength(2);
        expect(valid.data.addons).toHaveLength(2);
      }
    });

    it('validates a non-vegetarian dish', () => {
      const valid = MenuItemInputSchema.safeParse({
        name: 'Smoked Pepperoni Sourdough Pizza',
        price: 620,
        isVeg: false,
        spiceLevel: 2,
      });

      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.isVeg).toBe(false);
        expect(valid.data.categoryName).toBe('General');
      }
    });

    it('rejects negative prices', () => {
      const invalid = MenuItemInputSchema.safeParse({
        name: 'Cold Brew',
        price: -50,
      });

      expect(invalid.success).toBe(false);
    });

    it('enforces spice level bounds (0 to 3)', () => {
      const valid = MenuItemInputSchema.safeParse({
        name: 'Spicy Arrabiata',
        price: 380,
        spiceLevel: 3,
      });
      expect(valid.success).toBe(true);

      const invalid = MenuItemInputSchema.safeParse({
        name: 'Overly Spicy',
        price: 380,
        spiceLevel: 5,
      });
      expect(invalid.success).toBe(false);
    });
  });
});
