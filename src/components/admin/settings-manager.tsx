'use client';

import React, { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DomainShopSettings, OpeningHourSlot } from '@/lib/domain/types';
import {
  updateShopSettingsAction,
  uploadPharmacyLogoAction,
  removePharmacyLogoAction,
} from '@/lib/actions/settings-actions';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Textarea,
  Badge,
} from '@/components/ui';
import { PharmacyLogo } from '@/components/brand/pharmacy-logo';
import { StoreQrModal } from '@/components/admin/store-qr-modal';
import { QrCode } from 'lucide-react';
import styles from './settings-manager.module.css';

interface SettingsManagerProps {
  initialSettings: DomainShopSettings;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ initialSettings }) => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shopName, setShopName] = useState(initialSettings.shopName);
  const [tagline, setTagline] = useState(initialSettings.tagline ?? '');
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(initialSettings.logoUrl ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState(initialSettings.phoneNumber ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber ?? '');
  const [address, setAddress] = useState(initialSettings.address ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialSettings.googleMapsUrl ?? '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialSettings.googleReviewUrl ?? '');
  const [openingHours, setOpeningHours] = useState<OpeningHourSlot[]>(
    initialSettings.openingHours.length > 0
      ? initialSettings.openingHours
      : [
          { days: 'Monday - Saturday', hours: '8:00 AM - 11:00 PM' },
          { days: 'Sunday', hours: '9:00 AM - 9:00 PM' },
        ]
  );
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(initialSettings.isEmergencyOpen);
  const [showQrModal, setShowQrModal] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setLogoError('Logo image must be smaller than 3MB.');
      showNotification('error', 'Logo image must be smaller than 3MB.');
      return;
    }

    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setLogoError('Please choose a PNG, JPEG, or WebP image.');
      showNotification('error', 'Please choose a PNG, JPEG, or WebP image.');
      return;
    }

    setLogoError(null);
    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    const result = await uploadPharmacyLogoAction(formData);
    setIsUploadingLogo(false);

    if (result.success && result.logoUrl) {
      setCurrentLogoUrl(result.logoUrl);
      showNotification('success', 'Pharmacy logo uploaded and saved successfully.');
      startTransition(() => router.refresh());
    } else {
      setLogoError(result.message || 'Failed to upload logo.');
      showNotification('error', result.message || 'Failed to upload logo.');
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;
    setIsUploadingLogo(true);
    setLogoError(null);

    const result = await removePharmacyLogoAction();
    setIsUploadingLogo(false);

    if (result.success) {
      setCurrentLogoUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showNotification('success', 'Pharmacy logo removed successfully.');
      startTransition(() => router.refresh());
    } else {
      setLogoError(result.message || 'Failed to remove logo.');
      showNotification('error', result.message || 'Failed to remove logo.');
    }
  };

  // Opening Hours handlers
  const handleSlotChange = (index: number, field: 'days' | 'hours', value: string) => {
    setOpeningHours((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSlot = () => {
    setOpeningHours((prev) => [...prev, { days: 'New Day/Slot', hours: '8:00 AM - 10:00 PM' }]);
  };

  const handleRemoveSlot = (index: number) => {
    setOpeningHours((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetClosed = (index: number) => {
    handleSlotChange(index, 'hours', 'Closed');
  };

  const handleApplyPreset = (preset: 'standard' | 'alldays') => {
    if (preset === 'standard') {
      setOpeningHours([
        { days: 'Monday - Saturday', hours: '8:00 AM - 11:00 PM' },
        { days: 'Sunday', hours: 'Closed' },
      ]);
    } else if (preset === 'alldays') {
      setOpeningHours([{ days: 'All Days', hours: '8:00 AM - 11:00 PM' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    // Filter out completely empty rows
    const cleanedHours = openingHours.filter((slot) => slot.days.trim() && slot.hours.trim());

    const payload = {
      shopName: shopName.trim(),
      tagline: tagline.trim() ? tagline.trim() : null,
      phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
      whatsappNumber: whatsappNumber.trim() ? whatsappNumber.trim() : null,
      address: address.trim() ? address.trim() : null,
      googleMapsUrl: googleMapsUrl.trim() ? googleMapsUrl.trim() : null,
      googleReviewUrl: googleReviewUrl.trim() ? googleReviewUrl.trim() : null,
      openingHours: cleanedHours,
      isEmergencyOpen,
    };

    const result = await updateShopSettingsAction(payload);
    setIsSubmitting(false);

    if (result.success) {
      showNotification('success', 'Pharmacy settings and information saved successfully.');
      startTransition(() => router.refresh());
    } else {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      showNotification('error', result.message || 'Failed to save settings. Please check errors.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`${styles.notification} ${styles[notification.type]}`}
        >
          {notification.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Section 1: Pharmacy Identity & Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Pharmacy Identity & Branding</CardTitle>
            <CardDescription>
              Pharmacy branding, official logo, and name displayed across customer portals and digital cards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Logo Management */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Pharmacy Logo
                </label>
                <div className={styles.logoSection}>
                  <div className={styles.logoPreviewContainer}>
                    {currentLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentLogoUrl}
                        alt="Pharmacy Logo Preview"
                        className={styles.logoImage}
                      />
                    ) : (
                      <PharmacyLogo
                        shopName={shopName}
                        variant="mark"
                        size="md"
                      />
                    )}
                  </div>
                  <div className={styles.logoControls}>
                    <div className={styles.logoButtons}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        disabled={isUploadingLogo}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingLogo
                          ? 'Uploading...'
                          : currentLogoUrl
                          ? 'Change'
                          : 'Upload Logo'}
                      </Button>
                      {currentLogoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isUploadingLogo}
                          onClick={handleRemoveLogo}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className={styles.logoHelpText}>
                      Supported formats: PNG, JPEG, or WebP. Maximum size 3MB. Displayed on public pages and cards.
                    </p>
                    {logoError && <p className={styles.logoError}>{logoError}</p>}
                  </div>
                </div>
              </div>

              <Input
                label="Pharmacy Name"
                required
                value={shopName}
                error={fieldErrors.shopName}
                helpText="The primary business title for your pharmacy."
                placeholder="e.g. Arogya Pharmacy"
                onChange={(e) => setShopName(e.target.value)}
              />

              <Input
                label="Tagline (Optional)"
                value={tagline}
                error={fieldErrors.tagline}
                helpText="Short trust banner (e.g. Better Health. Brighter Tomorrow.)."
                placeholder="e.g. Better Health. Brighter Tomorrow."
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Contact Numbers & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Details & Physical Location</CardTitle>
            <CardDescription>
              Contact actions used for customer one-click Calls, WhatsApp, and Google Maps directions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className={styles.sectionGrid}>
                <Input
                  label="Phone Number"
                  value={phoneNumber}
                  error={fieldErrors.phoneNumber}
                  helpText="Customers click to initiate phone calls."
                  placeholder="e.g. +91 98765 43210"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />

                <Input
                  label="WhatsApp Number"
                  value={whatsappNumber}
                  error={fieldErrors.whatsappNumber}
                  helpText="Customers click to start a WhatsApp chat."
                  placeholder="e.g. +91 98765 43210"
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
              </div>

              <Textarea
                label="Physical Address"
                value={address}
                error={fieldErrors.address}
                helpText="Full storefront street address shown on your digital card."
                placeholder="e.g. Shop No. 4, Ground Floor, Station Road, Opp. Civil Hospital Gate 2"
                rows={3}
                onChange={(e) => setAddress(e.target.value)}
              />

              <Input
                label="Google Maps Location URL"
                value={googleMapsUrl}
                error={fieldErrors.googleMapsUrl}
                helpText="Must start with http:// or https://. Powers the 'Directions' button."
                placeholder="e.g. https://maps.google.com/?q=..."
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Review Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Google Review Configuration</CardTitle>
            <CardDescription>
              The destination link where customers are guided after drafting their review with the AI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label="Google Review Page Link"
              value={googleReviewUrl}
              error={fieldErrors.googleReviewUrl}
              helpText="Must start with http:// or https://. Usually formatted like https://g.page/r/example/review."
              placeholder="e.g. https://g.page/r/example/review"
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Section 3.5: Store QR Codes & Standees */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <CardTitle>Physical Store QR Codes &amp; Counter Standees</CardTitle>
                <CardDescription>
                  Generate, preview, and download print-ready QR codes for your billing counter, waiting tables, and customer cards.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowQrModal(true)}
              >
                <QrCode size={15} style={{ marginRight: '6px' }} />
                Open QR Studio
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                >
                  <QrCode size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    Billing Counter Standee &amp; Card Placements
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Tracks scans by location (counter, table, card) • Download high-res PNG, vector SVG, or printable tent standee
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowQrModal(true)}
              >
                View &amp; Download QR Codes →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Opening Hours */}
        <Card>
          <CardHeader>
            <div className={styles.hoursHeader}>
              <div>
                <CardTitle>Store Hours & Schedule</CardTitle>
                <CardDescription>
                  Configure your operating hours so patients know when the pharmacy counter is open.
                </CardDescription>
              </div>
              <div className={styles.hoursButtons}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApplyPreset('standard')}
                >
                  Preset: Mon-Sat + Sun Closed
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApplyPreset('alldays')}
                >
                  Preset: All Days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.hoursContainer}>
              <div className={styles.hoursList}>
                {openingHours.map((slot, index) => (
                  <div key={index} className={styles.slotRow}>
                    <Input
                      label="Day(s)"
                      value={slot.days}
                      placeholder="e.g. Monday - Saturday, Sunday"
                      onChange={(e) => handleSlotChange(index, 'days', e.target.value)}
                    />
                    <Input
                      label="Operating Hours"
                      value={slot.hours}
                      placeholder="e.g. 8:00 AM - 11:00 PM, or Closed"
                      onChange={(e) => handleSlotChange(index, 'hours', e.target.value)}
                    />
                    <div className={styles.slotActions}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetClosed(index)}
                      >
                        Set Closed
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={openingHours.length <= 1}
                        onClick={() => handleRemoveSlot(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSlot}>
                  + Add Another Schedule Row
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Emergency Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Availability Notice</CardTitle>
            <CardDescription>
              Special indicator for off-hours medicine emergency counter service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={styles.toggleCard}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={isEmergencyOpen}
                  onChange={(e) => setIsEmergencyOpen(e.target.checked)}
                />
                <span className={styles.toggleText}>
                  Enable Emergency / Night Availability Notice
                </span>
                {isEmergencyOpen && (
                  <Badge variant="warning" size="sm">
                    Notice Enabled
                  </Badge>
                )}
              </label>
              <p className={styles.toggleDescription}>
                When checked, a discreet emergency availability notice appears on your Digital Customer Card for customers needing essential medicines outside standard hours. This does not claim 24/7 hospital emergency services.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className={styles.footer}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Store QR Codes & Standee Modal */}
      <StoreQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        shopName={shopName}
      />
    </div>
  );
};

SettingsManager.displayName = 'SettingsManager';
