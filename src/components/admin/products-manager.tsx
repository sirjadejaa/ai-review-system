'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DomainProduct } from '@/lib/domain/types';
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  toggleProductFeaturedAction,
  uploadProductImageAction,
} from '@/lib/actions/product-actions';
import {
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Plus,
  Star,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Upload,
  ExternalLink,
  Package,
  ShoppingBag,
} from 'lucide-react';
import styles from './products-manager.module.css';

interface ProductsManagerProps {
  initialProducts: DomainProduct[];
  availableCategories: string[];
}

interface ProductFormData {
  name: string;
  category: string;
  customCategory: string;
  description: string;
  price: string;
  originalPrice: string;
  imageUrl: string;
  sizes: string;
  colors: string;
  productUrl: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_FORM: ProductFormData = {
  name: '',
  category: "Women's Wear",
  customCategory: '',
  description: '',
  price: '',
  originalPrice: '',
  imageUrl: '',
  sizes: '',
  colors: '',
  productUrl: '',
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

const DEFAULT_CATEGORIES = [
  "Women's Wear",
  "Men's Wear",
  "Kids' Wear",
  "Traditional Wear",
  "Western Wear",
  "Ethnic Wear",
  "Accessories",
  "New Arrivals",
  "Custom",
];

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  initialProducts,
  availableCategories,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [products, setProducts] = useState<DomainProduct[]>(initialProducts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DomainProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<DomainProduct | null>(null);

  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Combine default categories with any existing ones from database
  const combinedCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES.filter((c) => c !== 'Custom'), ...availableCategories])
  );

  // Stats
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isActive).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  const handleOpenAdd = () => {
    setFormData(DEFAULT_FORM);
    setFieldErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product: DomainProduct) => {
    const isCustomCat = !combinedCategories.includes(product.category);
    setFormData({
      name: product.name,
      category: isCustomCat ? 'Custom' : product.category,
      customCategory: isCustomCat ? product.category : '',
      description: product.description || '',
      price: product.price !== null && product.price !== undefined ? String(product.price) : '',
      originalPrice:
        product.originalPrice !== null && product.originalPrice !== undefined
          ? String(product.originalPrice)
          : '',
      imageUrl: product.imageUrl || '',
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      productUrl: product.productUrl || '',
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
    });
    setFieldErrors({});
    setEditingProduct(product);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showNotification('error', 'Image size must be under 4MB');
      return;
    }

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await uploadProductImageAction(data);
      if (res.success && res.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl! }));
        showNotification('success', 'Product photo uploaded');
      } else {
        showNotification('error', res.message || 'Failed to upload photo');
      }
    } catch {
      showNotification('error', 'Image processing failed');
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    const finalCategory =
      formData.category === 'Custom' ? formData.customCategory.trim() : formData.category;
    if (!finalCategory) {
      errors.category = 'Category is required';
    }
    if (formData.price && isNaN(Number(formData.price))) {
      errors.price = 'Price must be a valid number';
    }
    if (formData.originalPrice && isNaN(Number(formData.originalPrice))) {
      errors.originalPrice = 'Original price must be a valid number';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const finalCategory =
      formData.category === 'Custom' ? formData.customCategory.trim() : formData.category;

    const sizesArr = formData.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const colorsArr = formData.colors
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const priceNum = formData.price ? parseFloat(formData.price) : undefined;
    const origPriceNum = formData.originalPrice ? parseFloat(formData.originalPrice) : undefined;

    try {
      if (editingProduct) {
        const res = await updateProductAction(editingProduct.id, {
          name: formData.name.trim(),
          category: finalCategory,
          description: formData.description.trim() || undefined,
          price: priceNum,
          originalPrice: origPriceNum,
          imageUrl: formData.imageUrl || undefined,
          sizes: sizesArr,
          colors: colorsArr,
          productUrl: formData.productUrl.trim() || undefined,
          isFeatured: formData.isFeatured,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
        });

        if (res.success && res.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? res.product! : p))
          );
          setEditingProduct(null);
          showNotification('success', 'Product updated successfully');
          startTransition(() => router.refresh());
        } else {
          showNotification('error', res.message || 'Failed to update product');
        }
      } else {
        const res = await createProductAction({
          name: formData.name.trim(),
          category: finalCategory,
          description: formData.description.trim() || undefined,
          price: priceNum,
          originalPrice: origPriceNum,
          imageUrl: formData.imageUrl || undefined,
          sizes: sizesArr,
          colors: colorsArr,
          productUrl: formData.productUrl.trim() || undefined,
          isFeatured: formData.isFeatured,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder,
        });

        if (res.success && res.product) {
          setProducts((prev) => [res.product!, ...prev]);
          setIsAddModalOpen(false);
          showNotification('success', 'New product added to showcase');
          startTransition(() => router.refresh());
        } else {
          showNotification('error', res.message || 'Failed to create product');
        }
      }
    } catch {
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: DomainProduct) => {
    setTogglingId(product.id);
    const nextState = !product.isActive;
    try {
      const res = await toggleProductActiveAction(product.id, nextState);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? res.product! : p))
        );
        showNotification(
          'success',
          nextState ? 'Product is now active on storefront' : 'Product hidden from storefront'
        );
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message || 'Failed to toggle product status');
      }
    } catch {
      showNotification('error', 'Status update failed');
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleFeatured = async (product: DomainProduct) => {
    setTogglingId(product.id);
    const nextState = !product.isFeatured;
    try {
      const res = await toggleProductFeaturedAction(product.id, nextState);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? res.product! : p))
        );
        showNotification(
          'success',
          nextState ? 'Product marked as Featured' : 'Product removed from Featured'
        );
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message || 'Failed to update featured status');
      }
    } catch {
      showNotification('error', 'Featured toggle failed');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      const res = await deleteProductAction(deletingProduct.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        setDeletingProduct(null);
        showNotification('success', 'Product deleted permanently');
        startTransition(() => router.refresh());
      } else {
        showNotification('error', res.message || 'Failed to delete product');
      }
    } catch {
      showNotification('error', 'Delete operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products by category
  const filteredProducts =
    selectedCategoryFilter === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategoryFilter);

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              notification.type === 'success' ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
            color:
              notification.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            border: `1px solid ${
              notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'
            }`,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          {notification.text}
        </div>
      )}

      {/* Top Bar with Stats & Add Button */}
      <div className={styles.topBar}>
        <div className={styles.statsRow}>
          <Badge variant="neutral">Total: {totalCount}</Badge>
          <Badge variant="success">Active: {activeCount}</Badge>
          <Badge variant="warning">Featured: {featuredCount}</Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Category Filter */}
          <select
            className={styles.selectInput}
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
            aria-label="Filter by category"
          >
            <option value="all">All Categories ({totalCount})</option>
            {combinedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({products.filter((p) => p.category === cat).length})
              </option>
            ))}
          </select>

          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <Plus size={16} aria-hidden="true" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Products Showcase Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No Products Found"
          description={
            selectedCategoryFilter === 'all'
              ? 'Your clothing boutique has no showcase items yet. Add featured outfits, dresses, or collections to highlight on the customer landing page.'
              : `No products found under "${selectedCategoryFilter}".`
          }
          action={
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              <Plus size={16} aria-hidden="true" />
              <span>Add First Product</span>
            </Button>
          }
        />
      ) : (
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => {
            const hasOrigPrice =
              product.originalPrice !== null &&
              product.originalPrice !== undefined &&
              product.originalPrice > (product.price || 0);

            return (
              <div
                key={product.id}
                className={`${styles.productCard} ${!product.isActive ? styles.inactive : ''}`}
              >
                {/* Product Image Area */}
                <div className={styles.imageWrapper}>
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className={styles.productImage}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <ShoppingBag size={32} />
                      <span>No image provided</span>
                    </div>
                  )}

                  <div className={styles.cardBadges}>
                    {product.isFeatured && (
                      <Badge variant="warning">
                        <Star size={10} fill="currentColor" style={{ marginRight: 2 }} />
                        Featured
                      </Badge>
                    )}
                    {!product.isActive && <Badge variant="neutral">Hidden</Badge>}
                  </div>
                </div>

                {/* Content */}
                <div className={styles.cardContent}>
                  <div className={styles.categoryTag}>{product.category}</div>
                  <h3 className={styles.productName}>{product.name}</h3>

                  {product.description && (
                    <p className={styles.description}>{product.description}</p>
                  )}

                  {/* Sizing / Colors */}
                  {(product.sizes.length > 0 || product.colors.length > 0) && (
                    <div className={styles.tagsRow}>
                      {product.sizes.map((s) => (
                        <span key={s} className={styles.tagPill}>
                          {s}
                        </span>
                      ))}
                      {product.colors.map((c) => (
                        <span
                          key={c}
                          className={styles.tagPill}
                          style={{ borderColor: 'var(--color-accent-light)' }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pricing */}
                  <div className={styles.priceRow}>
                    {product.price !== null && product.price !== undefined ? (
                      <>
                        <span className={styles.price}>
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {hasOrigPrice && (
                          <span className={styles.originalPrice}>
                            ₹{product.originalPrice?.toLocaleString('en-IN')}
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-tertiary)',
                        }}
                      >
                        Price upon request
                      </span>
                    )}

                    {product.productUrl && (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--color-accent)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 2,
                          fontSize: '0.75rem',
                        }}
                        title="Open external link"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className={styles.cardActions}>
                  <div className={styles.actionButtons}>
                    {/* Toggle Active */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      disabled={togglingId === product.id}
                      title={product.isActive ? 'Hide from storefront' : 'Show on storefront'}
                    >
                      {product.isActive ? (
                        <Eye size={14} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <EyeOff size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                      )}
                    </Button>

                    {/* Toggle Featured */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(product)}
                      disabled={togglingId === product.id}
                      title={product.isFeatured ? 'Remove featured' : 'Mark as featured'}
                    >
                      <Star
                        size={14}
                        fill={product.isFeatured ? '#d49b44' : 'none'}
                        color={product.isFeatured ? '#d49b44' : 'var(--color-text-tertiary)'}
                      />
                    </Button>
                  </div>

                  <div className={styles.actionButtons}>
                    {/* Edit */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(product)}
                      title="Edit Product"
                    >
                      <Edit2 size={13} style={{ marginRight: 4 }} />
                      Edit
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingProduct(product)}
                      title="Delete Product"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen || editingProduct !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Showcase Product' : 'Add Showcase Product'}
      >
        <form onSubmit={handleSaveProduct} className={styles.formGrid}>
          {/* Name */}
          <div>
            <label className={styles.fieldLabel} htmlFor="prod-name">
              Product Name *
            </label>
            <Input
              id="prod-name"
              placeholder="e.g. Handcrafted Bandhani Silk Saree"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={fieldErrors.name}
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className={styles.formRow}>
            <div>
              <label className={styles.fieldLabel} htmlFor="prod-cat">
                Category *
              </label>
              <select
                id="prod-cat"
                className={styles.selectInput}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={isSubmitting}
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {formData.category === 'Custom' ? (
              <div>
                <label className={styles.fieldLabel} htmlFor="prod-custom-cat">
                  Custom Category Name *
                </label>
                <Input
                  id="prod-custom-cat"
                  placeholder="e.g. Bridal Lehengas"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  error={fieldErrors.category}
                  disabled={isSubmitting}
                />
              </div>
            ) : (
              <div>
                <label className={styles.fieldLabel} htmlFor="prod-order">
                  Display Order
                </label>
                <Input
                  id="prod-order"
                  type="number"
                  placeholder="0 (Lower shows first)"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className={styles.formRow}>
            <div>
              <label className={styles.fieldLabel} htmlFor="prod-price">
                Selling Price (₹)
              </label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                placeholder="e.g. 4999"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={fieldErrors.price}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className={styles.fieldLabel} htmlFor="prod-orig-price">
                Original Price (₹ MRP)
              </label>
              <Input
                id="prod-orig-price"
                type="number"
                step="0.01"
                placeholder="e.g. 6999"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                error={fieldErrors.originalPrice}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={styles.fieldLabel} htmlFor="prod-desc">
              Short Description
            </label>
            <Textarea
              id="prod-desc"
              rows={2}
              placeholder="Pure georgette fabric with traditional zari border and contrast blouse piece."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          {/* Image Upload / URL */}
          <div className={styles.imageUploadArea}>
            <label className={styles.fieldLabel}>Product Image</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Input
                placeholder="Image URL or upload file below..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                disabled={isSubmitting || isUploading}
                style={{ flex: 1 }}
              />
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <Upload size={14} />
                <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                  disabled={isSubmitting || isUploading}
                />
              </label>
            </div>

            {formData.imageUrl && (
              <div className={styles.imagePreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className={styles.previewImg}
                />
              </div>
            )}
          </div>

          {/* Sizes & Colors */}
          <div className={styles.formRow}>
            <div>
              <label className={styles.fieldLabel} htmlFor="prod-sizes">
                Sizes (Comma separated)
              </label>
              <Input
                id="prod-sizes"
                placeholder="S, M, L, XL, Free Size"
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className={styles.fieldLabel} htmlFor="prod-colors">
                Colors (Comma separated)
              </label>
              <Input
                id="prod-colors"
                placeholder="Maroon, Emerald, Navy, Gold"
                value={formData.colors}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* External URL */}
          <div>
            <label className={styles.fieldLabel} htmlFor="prod-url">
              External Product Link / Catalog URL (Optional)
            </label>
            <Input
              id="prod-url"
              placeholder="https://instagram.com/p/... or WhatsApp catalog link"
              value={formData.productUrl}
              onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-2)' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                disabled={isSubmitting}
              />
              <span>⭐ Feature on Homepage</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={isSubmitting}
              />
              <span>Active (Visible)</span>
            </label>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        title="Delete Showcase Product"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{deletingProduct?.name}</strong>?
            This will remove the product permanently from your boutique showcase.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              variant="outline"
              onClick={() => setDeletingProduct(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteProduct}
              isLoading={isSubmitting}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
