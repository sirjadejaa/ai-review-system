'use client';

import React, { useState } from 'react';
import styles from './menu-manager.module.css';
import type { DomainMenuCategory, DomainMenuItem, MenuItemVariant, MenuItemAddon } from '@/lib/domain/menu-types';
import {
  createMenuItemAction,
  updateMenuItemAction,
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
  createMenuCategoryAction,
  updateMenuCategoryAction,
  deleteMenuCategoryAction,
  reorderMenuCategoriesAction,
} from '@/lib/actions/menu-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Flame,
  Check,
  FolderPlus,
} from 'lucide-react';

export interface MenuManagerProps {
  initialCategories: DomainMenuCategory[];
  initialItems: DomainMenuItem[];
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  initialCategories,
  initialItems,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [categories, setCategories] = useState<DomainMenuCategory[]>(initialCategories);
  const [items, setItems] = useState<DomainMenuItem[]>(initialItems);

  // Filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DomainMenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    categoryId: '',
    price: 0,
    originalPrice: '' as string | number,
    isVeg: true,
    dietaryLabelsStr: '',
    spiceLevel: 0,
    servingInfo: '',
    variants: [] as MenuItemVariant[],
    addons: [] as MenuItemAddon[],
    isAvailable: true,
    isFeatured: false,
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<DomainMenuCategory | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    icon: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // -------------------------------------------------------------------------
  // ITEM MODAL HANDLERS
  // -------------------------------------------------------------------------

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      imageUrl: '',
      categoryId: categories[0]?.id || '',
      price: 250,
      originalPrice: '',
      isVeg: true,
      dietaryLabelsStr: '',
      spiceLevel: 0,
      servingInfo: '',
      variants: [],
      addons: [],
      isAvailable: true,
      isFeatured: false,
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: DomainMenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      categoryId: item.categoryId || '',
      price: item.price,
      originalPrice: item.originalPrice ?? '',
      isVeg: item.isVeg,
      dietaryLabelsStr: item.dietaryLabels.join(', '),
      spiceLevel: item.spiceLevel,
      servingInfo: item.servingInfo || '',
      variants: [...item.variants],
      addons: [...item.addons],
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showFeedback('Dish name is required', 'error');
      return;
    }

    setLoading(true);
    const dietaryLabels = itemForm.dietaryLabelsStr
      ? itemForm.dietaryLabelsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || undefined,
      imageUrl: itemForm.imageUrl.trim() || undefined,
      categoryId: itemForm.categoryId || undefined,
      price: Number(itemForm.price) || 0,
      originalPrice: itemForm.originalPrice ? Number(itemForm.originalPrice) : undefined,
      isVeg: itemForm.isVeg,
      dietaryLabels,
      spiceLevel: itemForm.spiceLevel,
      servingInfo: itemForm.servingInfo.trim() || undefined,
      variants: itemForm.variants,
      addons: itemForm.addons,
      isAvailable: itemForm.isAvailable,
      isFeatured: itemForm.isFeatured,
    };

    try {
      if (editingItem) {
        const res = await updateMenuItemAction(editingItem.id, payload);
        if (res.success && res.data) {
          setItems((prev) => prev.map((it) => (it.id === editingItem.id ? res.data! : it)));
          showFeedback('Dish updated successfully');
          setIsItemModalOpen(false);
        } else {
          showFeedback(res.message || 'Failed to update dish', 'error');
        }
      } else {
        const res = await createMenuItemAction(payload);
        if (res.success && res.data) {
          setItems((prev) => [res.data!, ...prev]);
          showFeedback('New dish added to menu');
          setIsItemModalOpen(false);
        } else {
          showFeedback(res.message || 'Failed to add dish', 'error');
        }
      }
    } catch {
      showFeedback('Operation failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

    try {
      const res = await deleteMenuItemAction(id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        showFeedback('Dish deleted');
      } else {
        showFeedback(res.message || 'Failed to delete dish', 'error');
      }
    } catch {
      showFeedback('Failed to delete dish', 'error');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      const res = await toggleMenuItemAvailabilityAction(id);
      if (res.success && res.data) {
        setItems((prev) => prev.map((it) => (it.id === id ? res.data! : it)));
        showFeedback(res.message || 'Status updated');
      }
    } catch {
      showFeedback('Failed to update status', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // CATEGORY MODAL HANDLERS
  // -------------------------------------------------------------------------

  const openAddCatModal = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', icon: '', isActive: true });
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat: DomainMenuCategory) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || '',
      isActive: cat.isActive,
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showFeedback('Category name is required', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      name: catForm.name.trim(),
      description: catForm.description.trim() || undefined,
      icon: catForm.icon.trim() || undefined,
      isActive: catForm.isActive,
    };

    try {
      if (editingCat) {
        const res = await updateMenuCategoryAction(editingCat.id, payload);
        if (res.success && res.data) {
          setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? res.data! : c)));
          showFeedback('Category updated');
          setIsCatModalOpen(false);
        } else {
          showFeedback(res.message || 'Failed to update category', 'error');
        }
      } else {
        const res = await createMenuCategoryAction({
          ...payload,
          sortOrder: categories.length,
        });
        if (res.success && res.data) {
          setCategories((prev) => [...prev, res.data!]);
          showFeedback('New category added');
          setIsCatModalOpen(false);
        } else {
          showFeedback(res.message || 'Failed to create category', 'error');
        }
      }
    } catch {
      showFeedback('Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCat = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Items in this category will become unassigned.`)) return;

    try {
      const res = await deleteMenuCategoryAction(id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showFeedback('Category deleted');
      } else {
        showFeedback(res.message || 'Failed to delete category', 'error');
      }
    } catch {
      showFeedback('Failed to delete category', 'error');
    }
  };

  const handleMoveCat = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const next = [...categories];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    setCategories(next);
    await reorderMenuCategoriesAction(next.map((c) => c.id));
  };

  // Filtered items
  const displayItems = items.filter((it) => {
    if (selectedCategoryFilter !== 'all' && it.categoryId !== selectedCategoryFilter) return false;
    if (searchFilter.trim().length > 0) {
      const q = searchFilter.toLowerCase().trim();
      return (
        it.name.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q) ||
        it.categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: feedbackMsg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            color: feedbackMsg.type === 'success' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
          }}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Top Bar with Tabs and Primary Action */}
      <div className={styles.topBar}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'items' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <UtensilsCrossed size={15} />
            <span>Dishes ({items.length})</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FolderPlus size={15} />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        <div className={styles.actionsGroup}>
          {activeTab === 'items' ? (
            <Button variant="primary" size="md" onClick={openAddItemModal}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Add Dish
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={openAddCatModal}>
              <Plus size={16} style={{ marginRight: 6 }} />
              Add Category
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: MENU DISHES */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 'var(--font-size-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                minWidth: '220px',
              }}
            />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 'var(--font-size-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: '#ffffff',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dishes Grid */}
          <div className={styles.itemsGrid}>
            {displayItems.map((item) => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                    alt={item.name}
                    className={styles.itemImage}
                  />
                  <div className={styles.cardBadges}>
                    <Badge variant={item.isVeg ? 'success' : 'danger'} size="sm">
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </Badge>
                    {item.isFeatured && (
                      <Badge variant="warning" size="sm">
                        <Sparkles size={10} style={{ marginRight: 3 }} />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span className={styles.cardCategory}>{item.categoryName}</span>
                      <h4 className={styles.cardTitle}>{item.name}</h4>
                    </div>
                    <span className={styles.cardPrice}>₹{item.price}</span>
                  </div>

                  {item.description && <p className={styles.cardDesc}>{item.description}</p>}

                  <div className={styles.cardFooter}>
                    <button
                      type="button"
                      className={styles.availabilityToggle}
                      onClick={() => handleToggleAvailability(item.id)}
                    >
                      <span className={item.isAvailable ? styles.dotAvailable : styles.dotSoldOut} />
                      <span>{item.isAvailable ? 'Available' : 'Sold Out'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => openEditItemModal(item)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 4 }}
                        title="Edit dish"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 4 }}
                        title="Delete dish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: CATEGORIES */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'categories' && (
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.categoryTable}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Order</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Dishes Count</th>
                <th>Status</th>
                <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => {
                const count = items.filter((it) => it.categoryId === cat.id).length;
                return (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCat(idx, 'up')}
                          style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1}
                          onClick={() => handleMoveCat(idx, 'down')}
                          style={{ background: 'none', border: 'none', cursor: idx === categories.length - 1 ? 'default' : 'pointer', opacity: idx === categories.length - 1 ? 0.3 : 1 }}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{cat.description || '—'}</td>
                    <td>{count} dishes</td>
                    <td>
                      <Badge variant={cat.isActive ? 'success' : 'neutral'} size="sm">
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openEditCatModal(cat)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 4 }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCat(cat.id, cat.name)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT DISH */}
      {/* ------------------------------------------------------------------- */}
      {isItemModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingItem ? 'Edit Dish' : 'Add New Dish'}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsItemModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className={styles.modalBody}>
                <Input
                  label="Dish Name *"
                  placeholder="e.g. Truffle Wild Mushroom Pizza"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                />

                <div className={styles.formGrid2}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                      Category
                    </label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: '#ffffff',
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                      Dietary Type
                    </label>
                    <select
                      value={itemForm.isVeg ? 'veg' : 'non-veg'}
                      onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.value === 'veg' })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: '#ffffff',
                      }}
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <Input
                    label="Price (₹) *"
                    type="number"
                    min="0"
                    step="1"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    required
                  />

                  <Input
                    label="Original Price (₹ Optional strike-through)"
                    type="number"
                    min="0"
                    step="1"
                    value={itemForm.originalPrice}
                    onChange={(e) => setItemForm({ ...itemForm, originalPrice: e.target.value })}
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 4 }}>
                      Spice Level (0 to 3)
                    </label>
                    <select
                      value={itemForm.spiceLevel}
                      onChange={(e) => setItemForm({ ...itemForm, spiceLevel: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: 'var(--font-size-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: '#ffffff',
                      }}
                    >
                      <option value={0}>0 — Not Spicy</option>
                      <option value={1}>1 — Mild</option>
                      <option value={2}>2 — Medium</option>
                      <option value={3}>3 — Spicy</option>
                    </select>
                  </div>

                  <Input
                    label="Serving Info"
                    placeholder="e.g. Serves 1-2, 350 ml, 6 slices"
                    value={itemForm.servingInfo}
                    onChange={(e) => setItemForm({ ...itemForm, servingInfo: e.target.value })}
                  />
                </div>

                <Input
                  label="Dietary Badges (Comma-separated)"
                  placeholder="e.g. Chef's Special, Vegan, Gluten-Free"
                  value={itemForm.dietaryLabelsStr}
                  onChange={(e) => setItemForm({ ...itemForm, dietaryLabelsStr: e.target.value })}
                />

                <Input
                  label="Image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                />

                <Textarea
                  label="Description"
                  placeholder="Ingredients, preparation details, flavor profile..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={3}
                />

                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.isAvailable}
                      onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                    />
                    Available to order
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={itemForm.isFeatured}
                      onChange={(e) => setItemForm({ ...itemForm, isFeatured: e.target.checked })}
                    />
                    Featured on Home
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Save Dish
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ------------------------------------------------------------------- */}
      {isCatModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: 480 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingCat ? 'Edit Category' : 'Add Category'}</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCatModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCat}>
              <div className={styles.modalBody}>
                <Input
                  label="Category Name *"
                  placeholder="e.g. Wood-Fired Pizza, Artisan Brews"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  required
                />

                <Textarea
                  label="Category Description"
                  placeholder="Short description of this section..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  rows={2}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={catForm.isActive}
                    onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                  />
                  Active (visible on customer menu)
                </label>
              </div>

              <div className={styles.modalFooter}>
                <Button type="button" variant="outline" onClick={() => setIsCatModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Save Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
