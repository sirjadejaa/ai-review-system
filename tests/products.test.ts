import { describe, it, expect } from 'vitest';
import { ProductInputSchema, DEFAULT_PRODUCT_CATEGORIES } from '@/lib/validation/product-schema';

describe('Clothing Products Showcase Validation & Schema', () => {
  it('validates a complete clothing product correctly', () => {
    const validProduct = {
      name: 'Handcrafted Zari Silk Saree',
      description: 'Pure Kanjivaram silk saree with authentic golden zari embroidery.',
      category: "Women's Wear",
      price: 12999,
      originalPrice: 15999,
      sizes: ['Free Size'],
      colors: ['Royal Blue', 'Deep Maroon'],
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c',
      productUrl: 'https://instagram.com/p/boutique-saree',
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
    };

    const parsed = ProductInputSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Handcrafted Zari Silk Saree');
      expect(parsed.data.category).toBe("Women's Wear");
      expect(parsed.data.price).toBe(12999);
      expect(parsed.data.originalPrice).toBe(15999);
      expect(parsed.data.sizes).toEqual(['Free Size']);
      expect(parsed.data.isFeatured).toBe(true);
    }
  });

  it('rejects product with missing or empty name', () => {
    const invalid = {
      name: ' ',
      category: "Women's Wear",
    };

    const parsed = ProductInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid or negative pricing', () => {
    const invalid = {
      name: 'Embroidered Kurta',
      price: -500,
    };

    const parsed = ProductInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('accepts base64 data URIs as product images', () => {
    const validDataUri = {
      name: 'Bespoke Linen Shirt',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    const parsed = ProductInputSchema.safeParse(validDataUri);
    expect(parsed.success).toBe(true);
  });

  it('includes standard clothing boutique categories', () => {
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Women's Wear");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Men's Wear");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Kids' Wear");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Traditional Wear");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Western Wear");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Ethnic Wear");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("Accessories");
    expect(DEFAULT_PRODUCT_CATEGORIES).toContain("New Arrivals");
  });

  it('supports custom category names', () => {
    const custom = {
      name: 'Bridal Velvet Lehenga',
      category: 'Bridal Haute Couture',
    };

    const parsed = ProductInputSchema.safeParse(custom);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe('Bridal Haute Couture');
    }
  });
});
