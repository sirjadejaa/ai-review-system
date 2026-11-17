/**
 * Restaurant & Café Digital Menu Domain Types
 */

export interface MenuItemVariant {
  name: string;
  price: number;
}

export interface MenuItemAddon {
  name: string;
  price: number;
}

export interface DomainMenuCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  items?: DomainMenuItem[];
}

export interface DomainMenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string;
  price: number;
  originalPrice: number | null;
  isVeg: boolean;
  dietaryLabels: string[]; // e.g. ["Vegan", "Gluten-Free", "Chef's Special"]
  spiceLevel: number;      // 0: None, 1: Mild, 2: Medium, 3: Spicy
  servingInfo: string | null; // e.g. "Serves 1-2", "350ml"
  variants: MenuItemVariant[];
  addons: MenuItemAddon[];
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
