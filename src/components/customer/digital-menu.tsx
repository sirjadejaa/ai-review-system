'use client';

import React, { useState, useMemo } from 'react';
import styles from './digital-menu.module.css';
import type { DomainMenuCategory, DomainMenuItem } from '@/lib/domain/menu-types';
import { useLanguage } from '@/lib/i18n/context';
import { Search, X, Flame, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export interface DigitalMenuProps {
  categories: DomainMenuCategory[];
  items: DomainMenuItem[];
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({ categories, items }) => {
  const { t } = useLanguage();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Active category names map
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.isActive);
  }, [categories]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category Filter
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }

      // 2. Veg / Non-Veg Filter
      if (dietaryFilter === 'veg' && !item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'non-veg' && item.isVeg) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) ?? false;
        const matchesCategory = item.categoryName.toLowerCase().includes(q);
        const matchesAddons = item.addons.some((a) => a.name.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesCategory && !matchesAddons) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategoryId, dietaryFilter, searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  const renderSpiceIndicator = (level: number) => {
    if (level <= 0) return null;
    return (
      <span className={styles.spiceRating} title={`Spice level: ${level}/3`}>
        {Array.from({ length: level }).map((_, i) => (
          <Flame key={i} size={13} fill="currentColor" />
        ))}
      </span>
    );
  };

  return (
    <section className={styles.container} id="menu" aria-label="Digital Restaurant Menu">
      {/* Section Header */}
      <div className={styles.header}>
        <span className={styles.sectionBadge}>
          <Sparkles size={12} style={{ marginRight: 4 }} />
          Artisanal Kitchen
        </span>
        <h2 className={styles.title}>{t.menuTitle}</h2>
        <p className={styles.subtitle}>{t.menuSubtitle}</p>
      </div>

      {/* Sticky Search & Filter Controls */}
      <div className={styles.controlsBar}>
        {/* Search Bar */}
        <div className={styles.searchRow}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search food and beverage menu"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories & Dietary Row */}
        <div className={styles.filterRow}>
          {/* Category Horizontal Scroll Pills */}
          <div className={styles.categoryScroll} role="tablist" aria-label="Menu Categories">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === 'all'}
              className={`${styles.categoryPill} ${selectedCategoryId === 'all' ? styles.categoryPillActive : ''}`}
              onClick={() => setSelectedCategoryId('all')}
            >
              <span>{t.allCategories}</span>
              <span style={{ opacity: 0.7, fontSize: '0.625rem' }}>({items.length})</span>
            </button>

            {activeCategories.map((cat) => {
              const count = items.filter((item) => item.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategoryId === cat.id}
                  className={`${styles.categoryPill} ${selectedCategoryId === cat.id ? styles.categoryPillActive : ''}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <span>{cat.name}</span>
                  <span style={{ opacity: 0.7, fontSize: '0.625rem' }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Pure Veg / All Toggle Group */}
          <div className={styles.dietaryToggleGroup} role="group" aria-label="Dietary Preferences">
            <button
              type="button"
              className={`${styles.dietaryBtn} ${dietaryFilter === 'all' ? styles.dietaryBtnActiveAll : ''}`}
              onClick={() => setDietaryFilter('all')}
            >
              {t.allDietary}
            </button>
            <button
              type="button"
              className={`${styles.dietaryBtn} ${dietaryFilter === 'veg' ? styles.dietaryBtnActiveVeg : ''}`}
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              aria-pressed={dietaryFilter === 'veg'}
            >
              <span className={`${styles.vegDot} ${styles.isVeg}`} style={{ display: 'inline-block' }} />
              {t.vegOnly}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dishes Grid */}
      {filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>{t.noMenuItemsFound}</p>
          <p className={styles.emptyStateText}>
            Try clearing search keywords or switching filters to view all available culinary creations.
          </p>
        </div>
      ) : (
        <div className={styles.menuGrid}>
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const hasVariants = item.variants && item.variants.length > 0;
            const hasAddons = item.addons && item.addons.length > 0;
            const isChefSpecial = item.dietaryLabels.some((l) => l.toLowerCase().includes('special'));

            return (
              <article key={item.id} className={styles.itemCard}>
                {/* Food Image Wrapper */}
                <div className={styles.itemImageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.imageUrl ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={item.name}
                    className={styles.itemImage}
                    loading="lazy"
                  />

                  {/* Overlay Badges */}
                  <div className={styles.imageOverlayBadges}>
                    {/* Veg / Non-Veg Indicator */}
                    <div
                      className={`${styles.vegIndicator} ${item.isVeg ? styles.isVeg : styles.isNonVeg}`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <div className={`${styles.vegDot} ${item.isVeg ? styles.isVeg : styles.isNonVeg}`} />
                    </div>

                    {isChefSpecial && (
                      <span className={styles.chefSpecialBadge}>
                        <Sparkles size={11} />
                        {t.chefSpecial}
                      </span>
                    )}
                  </div>

                  {!item.isAvailable && (
                    <div className={styles.soldOutOverlay}>
                      <span>{t.soldOut}</span>
                    </div>
                  )}
                </div>

                {/* Card Content Body */}
                <div className={styles.itemBody}>
                  <div className={styles.itemHeader}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <div className={styles.priceBlock}>
                      <span className={styles.itemPrice}>₹{item.price}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className={styles.originalPrice}>₹{item.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  {item.description && <p className={styles.itemDescription}>{item.description}</p>}

                  {/* Metadata Row: Spice & Serving Info */}
                  <div className={styles.metaRow}>
                    {item.servingInfo && <span className={styles.servingText}>• {item.servingInfo}</span>}
                    {renderSpiceIndicator(item.spiceLevel)}
                    {item.dietaryLabels.filter((l) => !l.toLowerCase().includes('special')).map((label, i) => (
                      <span key={i} style={{ color: 'var(--color-accent-text)', fontWeight: 500 }}>
                        • {label}
                      </span>
                    ))}

                    {(hasVariants || hasAddons) && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-accent)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                        }}
                      >
                        {isExpanded ? 'Less' : 'Options'}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Expandable Variants & Addons */}
                  {isExpanded && (hasVariants || hasAddons) && (
                    <div className={styles.expandableSection}>
                      {hasVariants && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {t.variantsLabel}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {item.variants.map((v, i) => (
                              <span key={i} className={styles.addonTag}>
                                {v.name}
                                <span className={styles.addonPrice}>₹{v.price}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {hasAddons && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {t.addonsLabel}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {item.addons.map((a, i) => (
                              <span key={i} className={styles.addonTag}>
                                + {a.name}
                                <span className={styles.addonPrice}>₹{a.price}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
