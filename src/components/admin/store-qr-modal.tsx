'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import styles from './store-qr-modal.module.css';

export interface StoreQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
  defaultDomain?: string;
}

interface PlacementOption {
  id: 'counter' | 'qr' | 'table' | 'card';
  title: string;
  locationHint: string;
  description: string;
  recommended?: boolean;
}

const PLACEMENTS: PlacementOption[] = [
  {
    id: 'counter',
    title: 'Checkout Counter',
    locationHint: 'Checkout & payment desk',
    description: 'Placed right where customers complete their purchase or receive their wrapped garments.',
    recommended: true,
  },
  {
    id: 'qr',
    title: 'Store Standee',
    locationHint: 'Entrance showcase or boutique table',
    description: 'Acrylic tent standee placed on the central styling table, mannequin showcase, or boutique entrance.',
  },
  {
    id: 'table',
    title: 'Fitting Suite',
    locationHint: 'Fitting room mirrors & lounge',
    description: 'Placed near fitting room mirrors or comfortable lounge chairs in the personal styling area.',
  },
  {
    id: 'card',
    title: 'Bag Insert Card',
    locationHint: 'Slip card inside shopping bag',
    description: 'Curated card placed inside luxury garment bags or attached to bespoke packaging.',
  },
];

export const StoreQrModal: React.FC<StoreQrModalProps> = ({
  isOpen,
  onClose,
  shopName = 'Maison & Thread',
  defaultDomain,
}) => {
  const [activePlacement, setActivePlacement] = useState<'counter' | 'qr' | 'table' | 'card'>('counter');
  const [domain, setDomain] = useState('');
  const [qrColor, setQrColor] = useState<'#171717' | '#a88b64' | '#000000'>('#171717');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const displayShopName = shopName === 'Pharmacy' ? 'Maison & Thread' : shopName;

  // Initialize domain from browser origin or prop
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detected = defaultDomain || window.location.origin;
      setDomain(detected);
    }
  }, [defaultDomain]);

  const activeOption = PLACEMENTS.find((p) => p.id === activePlacement) || PLACEMENTS[0];
  const targetUrl = `${domain.replace(/\/$/, '')}/?source=${activePlacement}`;

  // Generate QR preview on parameter changes
  const updateQr = useCallback(async () => {
    if (!targetUrl) return;
    try {
      setIsGenerating(true);
      const url = await QRCode.toDataURL(targetUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate preview QR:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [targetUrl, qrColor]);

  useEffect(() => {
    if (isOpen) {
      void updateQr();
    }
  }, [isOpen, updateQr]);

  // Handle URL Copy with Toast Feedback
  const handleCopyUrl = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  // High-Resolution PNG Download
  const handleDownloadPng = async () => {
    try {
      const highResDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 1024,
        margin: 2,
        color: {
          dark: qrColor,
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      const a = document.createElement('a');
      a.href = highResDataUrl;
      const cleanName = displayShopName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `${cleanName}-qr-${activePlacement}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate high-res QR for download:', err);
    }
  };

  // Print-Ready Display Standee
  const handlePrintStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${displayShopName} - QR Standee (${activeOption.title})</title>
          <style>
            @page {
              size: A5 portrait;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #FAF9F6;
              color: #171717;
              text-align: center;
            }
            .card {
              border: 1px solid #E8E5DF;
              border-radius: 16px;
              padding: 36px 28px;
              max-width: 380px;
              width: 100%;
              box-shadow: 0 4px 16px rgba(23, 23, 23, 0.06);
              background: #ffffff;
            }
            .header-label {
              font-size: 11px;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #A88B64;
              font-weight: 600;
              margin-bottom: 6px;
            }
            h1 {
              font-family: Georgia, serif;
              font-size: 26px;
              color: #171717;
              margin: 0 0 4px;
            }
            .tagline {
              font-size: 12px;
              color: #5B616E;
              margin: 0 0 24px;
            }
            .qr-frame {
              background: #ffffff;
              padding: 14px;
              border-radius: 12px;
              display: inline-block;
              box-shadow: 0 2px 8px rgba(23, 23, 23, 0.06);
              border: 1px solid #E8E5DF;
            }
            .qr-frame img {
              width: 220px;
              height: 220px;
              display: block;
            }
            .instructions {
              margin-top: 20px;
              font-size: 14px;
              color: #171717;
              font-weight: 500;
              line-height: 1.4;
            }
            .sub-instructions {
              margin-top: 6px;
              font-size: 11px;
              color: #8A909C;
            }
            .placement-badge {
              display: inline-block;
              margin-top: 18px;
              padding: 4px 12px;
              background: #FAF6F0;
              color: #705837;
              border: 1px solid #E8E5DF;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.06em;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-label">Welcome To</div>
            <h1>${displayShopName}</h1>
            <p class="tagline">Curated Apparel & Bespoke Studio</p>
            <div class="qr-frame">
              <img src="${qrDataUrl}" alt="${displayShopName} QR Code" />
            </div>
            <div class="instructions">
              Point your phone camera here to review your visit or view our boutique collection card.
            </div>
            <div class="sub-instructions">
              Fast • Seamless • No app required
            </div>
            <div class="placement-badge">
              ${activeOption.title}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Store QR Codes & Standees"
      description="Download high-resolution, print-ready QR codes for physical acrylic standees and bag insert cards."
    >
      <div className={styles.modalContent}>
        {/* Placement Selection Tabs */}
        <div>
          <label className={styles.optionLabel} style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Select Store Placement
          </label>
          <div className={styles.placementTabs} role="tablist">
            {PLACEMENTS.map((p) => {
              const isActive = p.id === activePlacement;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
                  onClick={() => setActivePlacement(p.id)}
                >
                  <span className={styles.tabTitle}>
                    {p.title}
                    {p.recommended && (
                      <Badge variant="primary" size="sm">
                        Best
                      </Badge>
                    )}
                  </span>
                  <span className={styles.tabTag}>source={p.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QR Preview & Action Area */}
        <div className={styles.previewGrid}>
          {/* Visual QR Card */}
          <div className={styles.qrCard}>
            <div className={styles.qrVisualFrame}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`${displayShopName} QR code preview`}
                  className={styles.qrImage}
                />
              ) : (
                <div className={styles.qrPlaceholder}>
                  {isGenerating ? 'Rendering QR…' : 'No preview'}
                </div>
              )}
            </div>

            <div className={styles.qrMetaInfo}>
              <span className={styles.qrTargetPlacement}>{activeOption.locationHint}</span>
              <span className={styles.qrTrackingNotice}>
                Attribution tag: <code>source={activePlacement}</code>
              </span>
            </div>
          </div>

          {/* Details & Export Actions */}
          <div className={styles.actionDetailsCol}>
            <div className={styles.placementExplainer}>
              <h4 className={styles.placementHeading}>{activeOption.title}</h4>
              <p className={styles.placementBody}>{activeOption.description}</p>
            </div>

            {/* QR Styling Controls */}
            <div className={styles.colorPickerSection}>
              <label className={styles.colorPickerLabel}>QR Aesthetic Tint</label>
              <div className={styles.colorOptions}>
                <button
                  type="button"
                  className={`${styles.colorChip} ${qrColor === '#171717' ? styles.colorChipActive : ''}`}
                  style={{ backgroundColor: '#171717' }}
                  onClick={() => setQrColor('#171717')}
                  title="Tailored Noir"
                  aria-label="Tailored Noir"
                />
                <button
                  type="button"
                  className={`${styles.colorChip} ${qrColor === '#a88b64' ? styles.colorChipActive : ''}`}
                  style={{ backgroundColor: '#a88b64' }}
                  onClick={() => setQrColor('#a88b64')}
                  title="Atelier Champagne Gold"
                  aria-label="Atelier Champagne Gold"
                />
                <button
                  type="button"
                  className={`${styles.colorChip} ${qrColor === '#000000' ? styles.colorChipActive : ''}`}
                  style={{ backgroundColor: '#000000' }}
                  onClick={() => setQrColor('#000000')}
                  title="Classic High Contrast Black"
                  aria-label="Classic High Contrast Black"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.exportButtons}>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handlePrintStandee}
                disabled={!qrDataUrl}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                <span>Print Standee (A5 Poster)</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={handleDownloadPng}
                disabled={!qrDataUrl}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Download size={16} />
                <span>Download PNG (1024px High-Res)</span>
              </Button>

              <button
                type="button"
                className={styles.copyLinkBtn}
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <>
                    <Check size={14} style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)' }}>Link copied to clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy destination link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Guidance Footer */}
        <div className={styles.modalFooterNote}>
          <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-accent)' }} />
          <span>
            <strong>Pro Tip:</strong> Place the acrylic standee near checkout counters or styling suites. Customers scan with their phone camera to leave a quick 5-star review.
          </span>
        </div>
      </div>
    </Modal>
  );
};

StoreQrModal.displayName = 'StoreQrModal';
