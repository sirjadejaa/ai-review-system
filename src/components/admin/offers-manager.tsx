'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DomainOffer } from '@/lib/domain/types';
import {
  createOfferAction,
  updateOfferAction,
  toggleOfferActiveAction,
  deleteOfferAction,
} from '@/lib/actions/offer-actions';
import { parseOfferExpiryDate } from '@/lib/validation/offer-schema';
import {
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  EmptyState,
} from '@/components/ui';
import { Plus } from 'lucide-react';
import styles from './offers-manager.module.css';

interface OffersManagerProps {
  initialOffers: DomainOffer[];
}

interface OfferFormData {
  title: string;
  description: string;
  badge: string;
  validUntil: string; // YYYY-MM-DD
  sortOrder: number;
  isActive: boolean;
}

const DEFAULT_FORM: OfferFormData = {
  title: '',
  description: '',
  badge: '',
  validUntil: '',
  sortOrder: 0,
  isActive: true,
};

export const OffersManager: React.FC<OffersManagerProps> = ({ initialOffers }) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [offers, setOffers] = useState<DomainOffer[]>(initialOffers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<DomainOffer | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<DomainOffer | null>(null);

  const [formData, setFormData] = useState<OfferFormData>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Stats
  const now = new Date();
  const totalCount = offers.length;
  const activeCount = offers.filter((o) => o.isActive && (!o.validUntil || new Date(o.validUntil) >= now)).length;
  const expiredCount = offers.filter((o) => o.validUntil && new Date(o.validUntil) < now).length;

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

  const handleOpenEdit = (offer: DomainOffer) => {
    let dateStr = '';
    if (offer.validUntil) {
      const d = new Date(offer.validUntil);
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    setFormData({
      title: offer.title,
      description: offer.description ?? '',
      badge: offer.badge ?? '',
      validUntil: dateStr,
      sortOrder: offer.sortOrder,
      isActive: offer.isActive,
    });
    setFieldErrors({});
    setEditingOffer(offer);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setEditingOffer(null);
    setDeletingOffer(null);
    setFieldErrors({});
    setIsSubmitting(false);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    const payload = {
      title: formData.title,
      description: formData.description.trim() ? formData.description : null,
      badge: formData.badge.trim() ? formData.badge : null,
      validUntil: formData.validUntil ? parseOfferExpiryDate(formData.validUntil) ?? null : null,
      sortOrder: Number(formData.sortOrder) || 0,
      isActive: formData.isActive,
    };

    if (editingOffer) {
      const result = await updateOfferAction(editingOffer.id, payload);
      setIsSubmitting(false);

      if (result.success && result.offer) {
        const updatedOffer = result.offer;
        setOffers((prev) =>
          prev.map((o) => (o.id === updatedOffer.id ? updatedOffer : o))
        );
        handleCloseModals();
        showNotification('success', 'Offer updated successfully.');
        startTransition(() => router.refresh());
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        showNotification('error', result.message || 'Failed to update offer.');
      }
    } else {
      const result = await createOfferAction(payload);
      setIsSubmitting(false);

      if (result.success && result.offer) {
        const createdOffer = result.offer;
        setOffers((prev) => [createdOffer, ...prev].sort((a, b) => a.sortOrder - b.sortOrder));
        handleCloseModals();
        showNotification('success', 'New offer published successfully.');
        startTransition(() => router.refresh());
      } else {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        showNotification('error', result.message || 'Failed to create offer.');
      }
    }
  };

  const handleToggleActive = async (offer: DomainOffer) => {
    setTogglingId(offer.id);
    const result = await toggleOfferActiveAction(offer.id);
    setTogglingId(null);

    if (result.success && result.offer) {
      const updatedOffer = result.offer;
      setOffers((prev) =>
        prev.map((o) => (o.id === updatedOffer.id ? updatedOffer : o))
      );
      showNotification('success', result.message || 'Status updated.');
      startTransition(() => router.refresh());
    } else {
      showNotification('error', result.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteOffer = async () => {
    if (!deletingOffer) return;
    setIsSubmitting(true);

    const result = await deleteOfferAction(deletingOffer.id);
    setIsSubmitting(false);

    if (result.success) {
      setOffers((prev) => prev.filter((o) => o.id !== deletingOffer.id));
      handleCloseModals();
      showNotification('success', 'Offer removed permanently.');
      startTransition(() => router.refresh());
    } else {
      showNotification('error', result.message || 'Failed to delete offer.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            backgroundColor:
              notification.type === 'success'
                ? 'var(--color-success-bg, #f0fdf4)'
                : 'var(--color-danger-bg, #fef2f2)',
            color:
              notification.type === 'success'
                ? 'var(--color-success-text, #166534)'
                : 'var(--color-danger-text, #991b1b)',
            border: `1px solid ${
              notification.type === 'success'
                ? 'var(--color-success-border, #bbf7d0)'
                : 'var(--color-danger-border, #fecaca)'
            }`,
          }}
        >
          {notification.text}
        </div>
      )}

      {/* Top Bar with summary badges & Add button */}
      <div className={styles.topBar}>
        <div className={styles.statsRow}>
          <Badge variant="neutral" size="sm">
            Total Offers: {totalCount}
          </Badge>
          <Badge variant="success" size="sm">
            Active: {activeCount}
          </Badge>
          {expiredCount > 0 && (
            <Badge variant="warning" size="sm">
              Expired: {expiredCount}
            </Badge>
          )}
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus size={15} style={{ marginRight: '4px' }} aria-hidden="true" />
          Create Offer
        </Button>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <EmptyState
          title="No Store Offers Configured"
          description="Create promotional discounts, senior citizen perks, or seasonal health announcements. Active offers appear automatically on your Digital Customer Card."
          action={
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus size={15} style={{ marginRight: '4px' }} aria-hidden="true" />
              Create Offer
            </Button>
          }
        />
      ) : (
        <div className={styles.list}>
          {offers.map((offer) => {
            const isExpired = Boolean(offer.validUntil && new Date(offer.validUntil) < now);
            const isCustomerVisible = offer.isActive && !isExpired;

            return (
              <div
                key={offer.id}
                className={`${styles.offerCard} ${!offer.isActive ? styles.inactive : ''}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.titleArea}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.offerTitle}>{offer.title}</h3>
                      {offer.badge && (
                        <Badge variant="primary" size="sm">
                          {offer.badge}
                        </Badge>
                      )}
                    </div>

                    <div className={styles.statusBadges}>
                      {isCustomerVisible ? (
                        <Badge variant="success" size="sm">
                          Active & Visible
                        </Badge>
                      ) : offer.isActive && isExpired ? (
                        <Badge variant="warning" size="sm">
                          Expired (Hidden from Card)
                        </Badge>
                      ) : !offer.isActive && isExpired ? (
                        <Badge variant="neutral" size="sm">
                          Inactive & Expired
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Inactive (Draft/Hidden)
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={styles.actionsRow}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={togglingId === offer.id}
                      onClick={() => handleToggleActive(offer)}
                    >
                      {togglingId === offer.id
                        ? 'Updating...'
                        : offer.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(offer)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingOffer(offer)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {offer.description && (
                  <p className={styles.description}>{offer.description}</p>
                )}

                <div className={styles.metaGrid}>
                  <span className={styles.metaItem}>
                    Sort Order: <strong>{offer.sortOrder}</strong> (Lower = higher priority)
                  </span>

                  <span className={styles.metaItem}>
                    Valid Until:{' '}
                    <strong>
                      {offer.validUntil
                        ? new Date(offer.validUntil).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No Expiration'}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Offer Modal */}
      <Modal
        isOpen={isAddModalOpen || editingOffer !== null}
        onClose={handleCloseModals}
        title={editingOffer ? 'Edit Offer' : 'Add Store Offer'}
        description="Configure promotional details shown on the pharmacy's Digital Customer Card."
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={handleCloseModals}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSaveOffer}
            >
              {isSubmitting
                ? 'Saving...'
                : editingOffer
                ? 'Save Changes'
                : 'Publish Offer'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveOffer} className={styles.form}>
          <Input
            label="Offer Title"
            required
            placeholder="e.g. 10% Discount on First Aid & Wellness"
            value={formData.title}
            error={fieldErrors.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />

          <Textarea
            label="Description (Optional)"
            placeholder="e.g. Applicable on all non-prescription wellness items and general essentials."
            value={formData.description}
            error={fieldErrors.description}
            rows={3}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <div className={styles.formGrid}>
            <Input
              label="Highlight Badge (Optional)"
              placeholder="e.g. SPECIAL, 10% OFF, SENIOR"
              value={formData.badge}
              error={fieldErrors.badge}
              helpText="Short badge displayed next to the offer."
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, badge: e.target.value }))
              }
            />

            <Input
              type="date"
              label="Valid Until (Optional)"
              value={formData.validUntil}
              error={fieldErrors.validUntil}
              helpText="Leave blank for ongoing offers without expiration."
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
              }
            />
          </div>

          <div className={styles.formGrid}>
            <Input
              type="number"
              label="Display Order"
              value={String(formData.sortOrder)}
              error={fieldErrors.sortOrder}
              helpText="0 appears first, followed by 1, 2, 3..."
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sortOrder: parseInt(e.target.value, 10) || 0,
                }))
              }
            />

            <div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                <span>Active (Enable offer)</span>
              </label>
              <p className={styles.helperText}>
                Uncheck to hide this offer temporarily without deleting it.
              </p>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingOffer !== null}
        onClose={handleCloseModals}
        title="Delete Offer?"
        description="Permanently remove this promotional offer."
        footer={
          <div className={styles.modalFooter}>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={handleCloseModals}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDeleteOffer}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Offer'}
            </Button>
          </div>
        }
      >
        {deletingOffer && (
          <div className={styles.deleteWarning}>
            <p>
              Are you sure you want to delete this promotional offer? It will be permanently removed from your pharmacy records and will no longer appear on your Digital Customer Card.
            </p>
            <div className={styles.deleteHighlight}>
              {deletingOffer.title}
              {deletingOffer.badge && ` (${deletingOffer.badge})`}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

OffersManager.displayName = 'OffersManager';
