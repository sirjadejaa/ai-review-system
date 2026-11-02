'use client';

import React, { useState, useMemo } from 'react';
import type { DomainProduct } from '@/lib/domain/types';
import { useLanguage } from '@/lib/i18n/context';
import { ExternalLink, Tag } from 'lucide-react';
import styles from './featured-products.module.css';

export interface FeaturedProductsProps {
  products: DomainProduct[];
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products }) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories available among the products
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return ['All', ...Array.from(list)];
  }, [products]);

  // Filter products by active category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.container} aria-label="Featured Products">
      <div className={styles.header}>
        <span className={styles.badge}>{t.shopCategory}</span>
        <h2 className={styles.title}>{t.featuredProductsTitle}</h2>
        <p className={styles.subtitle}>{t.featuredProductsSubtitle}</p>
      </div>

      {/* Category Tabs */}
      {categories.length > 2 && (
        <div className={styles.categoryTabs} role="tablist" aria-label="Product categories">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.categoryButton} ${isActive ? styles.categoryActive : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'All' ? t.allCategories : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      <div className={styles.grid}>
        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t.noProductsFound}</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const hasDiscount =
              product.originalPrice &&
              product.price &&
              product.originalPrice > product.price;

            const discountPercent = hasDiscount
              ? Math.round(
                  ((product.originalPrice! - product.price!) / product.originalPrice!) * 100
                )
              : null;

            return (
              <article key={product.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className={styles.image}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <Tag size={28} aria-hidden="true" />
                      <span>{product.category}</span>
                    </div>
                  )}

                  {product.isFeatured && (
                    <span className={styles.featuredBadge}>Featured</span>
                  )}

                  {discountPercent && (
                    <span className={styles.discountBadge}>-{discountPercent}%</span>
                  )}
                </div>

                <div className={styles.content}>
                  <span className={styles.categoryTag}>{product.category}</span>
                  <h3 className={styles.name} title={product.name}>
                    {product.name}
                  </h3>

                  {product.price !== null && (
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₹{product.price.toLocaleString('en-IN')}</span>
                      {hasDiscount && (
                        <span className={styles.originalPrice}>
                          ₹{product.originalPrice!.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  )}

                  {product.sizes && product.sizes.length > 0 && (
                    <div className={styles.metaRow}>
                      <span>{t.sizeLabel}</span>
                      {product.sizes.slice(0, 4).map((s) => (
                        <span key={s} className={styles.sizeChip}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {product.productUrl && (
                    <div className={styles.cardAction}>
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.detailsButton}
                      >
                        <span>{t.viewDetails}</span>
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
