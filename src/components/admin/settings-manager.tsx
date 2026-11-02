'use client';

import React, { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DomainShopSettings, OpeningHourSlot } from '@/lib/domain/types';
import {
  updateShopSettingsAction,
  uploadBoutiqueLogoAction,
  removeBoutiqueLogoAction,
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
import { BoutiqueLogo } from '@/components/brand/boutique-logo';
import { StoreQrModal } from '@/components/admin/store-qr-modal';
import { QrCode, Sparkles, Palette, Globe } from 'lucide-react';
import styles from './settings-manager.module.css';

interface SettingsManagerProps {
  initialSettings: DomainShopSettings;
}

const PALETTE_PRESETS = [
  {
    name: 'Noir & Atelier Gold',
    primary: '#171717',
    secondary: '#3a3a3a',
    accent: '#a88b64',
  },
  {
    name: 'Cashmere & Sand',
    primary: '#2b2621',
    secondary: '#544b43',
    accent: '#c2a68c',
  },
  {
    name: 'Midnight & Silk',
    primary: '#161b26',
    secondary: '#323b4e',
    accent: '#8b9eb7',
  },
  {
    name: 'Atelier Olive & Linen',
    primary: '#222b24',
    secondary: '#465248',
    accent: '#9eab9d',
  },
];

export const SettingsManager: React.FC<SettingsManagerProps> = ({ initialSettings }) => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultShopName = initialSettings.shopName === 'Pharmacy' ? 'Maison & Thread' : initialSettings.shopName;
  const defaultTagline = initialSettings.tagline || 'Curated Contemporary Fashion & Bespoke Tailoring';

  const [shopName, setShopName] = useState(defaultShopName);
  const [tagline, setTagline] = useState(defaultTagline);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(initialSettings.logoUrl ?? null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Custom Colors
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primaryColor || '#171717');
  const [secondaryColor, setSecondaryColor] = useState(initialSettings.secondaryColor || '#3a3a3a');
  const [accentColor, setAccentColor] = useState(initialSettings.accentColor || '#a88b64');

  const [phoneNumber, setPhoneNumber] = useState(initialSettings.phoneNumber ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber ?? '');
  const [address, setAddress] = useState(initialSettings.address ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialSettings.googleMapsUrl ?? '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialSettings.googleReviewUrl ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(initialSettings.websiteUrl ?? '');
  const [socialLinksText, setSocialLinksText] = useState(
    Array.isArray(initialSettings.socialLinks) ? initialSettings.socialLinks.join(', ') : ''
  );

  const [openingHours, setOpeningHours] = useState<OpeningHourSlot[]>(
    initialSettings.openingHours.length > 0
      ? initialSettings.openingHours
      : [
          { days: 'Monday - Saturday', hours: '10:00 AM - 9:00 PM' },
          { days: 'Sunday', hours: '11:00 AM - 7:00 PM' },
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

  const handleApplyPalette = (palette: typeof PALETTE_PRESETS[number]) => {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setAccentColor(palette.accent);
    showNotification('success', `Applied ${palette.name} theme colors.`);
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

    const result = await uploadBoutiqueLogoAction(formData);
    setIsUploadingLogo(false);

    if (result.success && result.logoUrl) {
      setCurrentLogoUrl(result.logoUrl);
      showNotification('success', 'Boutique logo uploaded and saved successfully.');
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

    const result = await removeBoutiqueLogoAction();
    setIsUploadingLogo(false);

    if (result.success) {
      setCurrentLogoUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showNotification('success', 'Boutique logo removed successfully.');
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
    setOpeningHours((prev) => [...prev, { days: 'New Slot', hours: '10:00 AM - 9:00 PM' }]);
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
        { days: 'Monday - Saturday', hours: '10:00 AM - 9:00 PM' },
        { days: 'Sunday', hours: '11:00 AM - 7:00 PM' },
      ]);
    } else if (preset === 'alldays') {
      setOpeningHours([{ days: 'All Days', hours: '10:00 AM - 9:00 PM' }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});

    // Filter out completely empty rows
    const cleanedHours = openingHours.filter((slot) => slot.days.trim() && slot.hours.trim());

    // Parse social links from comma-separated string
    const socialLinksArray = socialLinksText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      shopName: shopName.trim(),
      tagline: tagline.trim() ? tagline.trim() : null,
      logoUrl: currentLogoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
      whatsappNumber: whatsappNumber.trim() ? whatsappNumber.trim() : null,
      address: address.trim() ? address.trim() : null,
      googleMapsUrl: googleMapsUrl.trim() ? googleMapsUrl.trim() : null,
      googleReviewUrl: googleReviewUrl.trim() ? googleReviewUrl.trim() : null,
      websiteUrl: websiteUrl.trim() ? websiteUrl.trim() : null,
      socialLinks: socialLinksArray,
      openingHours: cleanedHours,
      isEmergencyOpen,
    };

    const result = await updateShopSettingsAction(payload);
    setIsSubmitting(false);

    if (result.success) {
      showNotification('success', 'Boutique information and styling saved successfully.');
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
        {/* Section 1: Boutique Identity & Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Boutique Identity &amp; Branding</CardTitle>
            <CardDescription>
              Store branding, official atelier logo, and name displayed across customer review pages and privilege cards.
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
                  Boutique Logo
                </label>
                <div className={styles.logoSection}>
                  <div className={styles.logoPreviewContainer}>
                    {currentLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentLogoUrl}
                        alt="Boutique Logo Preview"
                        className={styles.logoImage}
                      />
                    ) : (
                      <BoutiqueLogo
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
                          ? 'Change Logo'
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
                      Supported formats: PNG, JPEG, or WebP. Maximum size 3MB. Displayed on public review pages and digital passes.
                    </p>
                    {logoError && <p className={styles.logoError}>{logoError}</p>}
                  </div>
                </div>
              </div>

              <Input
                label="Store Name"
                required
                value={shopName}
                error={fieldErrors.shopName}
                helpText="The primary brand title for your clothing store."
                placeholder="e.g. Maison & Thread"
                onChange={(e) => setShopName(e.target.value)}
              />

              <Input
                label="Tagline & Brand Statement"
                value={tagline}
                error={fieldErrors.tagline}
                helpText="Short editorial descriptor (e.g. Curated Contemporary Fashion & Bespoke Tailoring)."
                placeholder="e.g. Luxury Apparel & Bespoke Studio"
                maxLength={150}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Visual Brand Palette Customization */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={18} style={{ color: 'var(--color-accent)' }} />
              <CardTitle>Brand Colors &amp; Styling</CardTitle>
            </div>
            <CardDescription>
              Customize your boutique palette or select an editorial fashion preset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Editorial Presets
                </label>
                <div className={styles.palettePresets}>
                  {PALETTE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className={styles.palettePresetBtn}
                      onClick={() => handleApplyPalette(p)}
                    >
                      <div className={styles.swatchPreview}>
                        <span className={styles.swatchDot} style={{ backgroundColor: p.primary }} />
                        <span className={styles.swatchDot} style={{ backgroundColor: p.secondary }} />
                        <span className={styles.swatchDot} style={{ backgroundColor: p.accent }} />
                      </div>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.colorPickerGrid}>
                <div className={styles.colorFieldGroup}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    Primary Noir / Brand
                  </label>
                  <div className={styles.colorInputRow}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className={styles.colorNativePicker}
                      aria-label="Pick primary color"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#171717"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className={styles.colorFieldGroup}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    Secondary Slate / Charcoal
                  </label>
                  <div className={styles.colorInputRow}>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className={styles.colorNativePicker}
                      aria-label="Pick secondary color"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#3a3a3a"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className={styles.colorFieldGroup}>
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    Boutique Accent Gold
                  </label>
                  <div className={styles.colorInputRow}>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className={styles.colorNativePicker}
                      aria-label="Pick accent color"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#a88b64"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Contact Channels & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Channels &amp; Store Location</CardTitle>
            <CardDescription>
              Direct contact options for customer inquiries, stylist consultations, and store directions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className={styles.sectionGrid}>
                <Input
                  label="Store Phone Number"
                  type="tel"
                  value={phoneNumber}
                  error={fieldErrors.phoneNumber}
                  helpText="Displayed on customer card for direct calls."
                  placeholder="e.g. +91 98765 43210"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />

                <Input
                  label="Stylist WhatsApp Number"
                  type="tel"
                  value={whatsappNumber}
                  error={fieldErrors.whatsappNumber}
                  helpText="Direct chat link for sizing questions & collections."
                  placeholder="e.g. +91 98765 43210"
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
              </div>

              <Textarea
                label="Physical Store Address"
                value={address}
                error={fieldErrors.address}
                helpText="Full street address, landmark, and city."
                placeholder="e.g. Shop 4B, Heritage Galleria, Fashion Boulevard, Mumbai"
                rows={2}
                maxLength={250}
                onChange={(e) => setAddress(e.target.value)}
              />

              <Input
                label="Google Maps Location URL"
                type="url"
                value={googleMapsUrl}
                error={fieldErrors.googleMapsUrl}
                helpText="Valid link to your location on Google Maps for the Directions button."
                placeholder="https://maps.google.com/?q=..."
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Google Review Integration */}
        <Card>
          <CardHeader>
            <CardTitle>Google Review Integration</CardTitle>
            <CardDescription>
              Direct Google Reviews link where happy customers will paste their generated review drafts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              label="Google Review Direct URL"
              type="url"
              value={googleReviewUrl}
              error={fieldErrors.googleReviewUrl}
              helpText="Your Google Business Profile review link (e.g. https://g.page/r/your-shop/review)."
              placeholder="https://g.page/r/.../review"
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Section 5: Web & Social Presence */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} style={{ color: 'var(--color-accent)' }} />
              <CardTitle>Web &amp; Social Links</CardTitle>
            </div>
            <CardDescription>
              Add your website or Instagram handles to connect with customers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={styles.sectionGrid}>
              <Input
                label="Official Website URL"
                type="url"
                value={websiteUrl}
                error={fieldErrors.websiteUrl}
                helpText="e.g. https://maisonandthread.com"
                placeholder="https://yourboutique.com"
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />

              <Input
                label="Instagram / Social Links"
                value={socialLinksText}
                helpText="Comma-separated URLs or handles (e.g. @maisonandthread, https://instagram.com/...)"
                placeholder="@yourboutique, https://instagram.com/..."
                onChange={(e) => setSocialLinksText(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Store Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Store Hours</CardTitle>
            <CardDescription>
              Manage your boutique opening hours shown on the customer portal and digital card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={styles.hoursContainer}>
              <div className={styles.hoursHeader}>
                <p className={styles.hoursHelp}>
                  Configure days and opening hours below.
                </p>
                <div className={styles.hoursButtons}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyPreset('standard')}
                  >
                    Boutique Retail Preset
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyPreset('alldays')}
                  >
                    All Days 10am-9pm
                  </Button>
                </div>
              </div>

              <div className={styles.hoursList}>
                {openingHours.map((slot, index) => (
                  <div key={index} className={styles.slotRow}>
                    <Input
                      label={`Slot ${index + 1} Days`}
                      value={slot.days}
                      placeholder="e.g. Monday - Saturday"
                      onChange={(e) => handleSlotChange(index, 'days', e.target.value)}
                    />
                    <Input
                      label="Hours"
                      value={slot.hours}
                      placeholder="e.g. 10:00 AM - 9:00 PM"
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
                        onClick={() => handleRemoveSlot(index)}
                        disabled={openingHours.length <= 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSlot}>
                  + Add Another Time Slot
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Submission Footer */}
        <div className={styles.footer}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Save All Settings
          </Button>
        </div>
      </form>

      <StoreQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        shopName={shopName}
      />
    </div>
  );
};

SettingsManager.displayName = 'SettingsManager';
