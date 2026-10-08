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
    title: 'Billing Counter',
    locationHint: 'Billing desk & cash counter',
    description: 'Placed right by the payment terminal. Highest conversion rate while customers wait for their bill.',
    recommended: true,
  },
  {
    id: 'qr',
    title: 'Store Standee',
    locationHint: 'Entrance or main showcase',
    description: 'General store standee or acrylic tent card placed on the central counter or medicine display.',
  },
  {
    id: 'table',
    title: 'Waiting Table',
    locationHint: 'Patient bench or waiting chairs',
    description: 'Placed where patients or family members sit while waiting for medicine dispensing.',
  },
  {
    id: 'card',
    title: 'Pocket Card',
    locationHint: 'Printed cards in medicine bag',
    description: 'Mini business card slipped into the customer bag or stapled to the paper invoice.',
  },
];

export const StoreQrModal: React.FC<StoreQrModalProps> = ({
  isOpen,
  onClose,
  shopName = 'Pharmacy',
  defaultDomain,
}) => {
  const [activePlacement, setActivePlacement] = useState<'counter' | 'qr' | 'table' | 'card'>('counter');
  const [domain, setDomain] = useState('');
  const [qrColor, setQrColor] = useState<'#123e35' | '#000000'>('#123e35');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

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
      const link = document.createElement('a');
      link.href = highResDataUrl;
      link.download = `${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr-${activePlacement}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download PNG QR:', err);
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: qrColor,
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr-${activePlacement}.svg`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download SVG QR:', err);
    }
  };

  const handlePrintStandee = () => {
    const printWindow = window.open('', '_blank', 'width=650,height=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shopName} - Counter QR Standee</title>
          <style>
            @page { size: A6 portrait; margin: 12mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #14221d;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              text-align: center;
              padding: 24px;
              box-sizing: border-box;
            }
            .card {
              border: 2px solid #123e35;
              border-radius: 16px;
              padding: 32px 24px;
              width: 100%;
              max-width: 380px;
              box-sizing: border-box;
            }
            .header-label {
              font-size: 11px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #4a6b61;
              font-weight: 600;
              margin-bottom: 6px;
            }
            h1 {
              font-family: Georgia, serif;
              font-size: 24px;
              color: #123e35;
              margin: 0 0 4px;
            }
            .tagline {
              font-size: 12px;
              color: #667870;
              margin: 0 0 20px;
            }
            .qr-frame {
              background: #ffffff;
              padding: 12px;
              border-radius: 12px;
              display: inline-block;
              box-shadow: 0 2px 8px rgba(18, 62, 53, 0.08);
            }
            .qr-frame img {
              width: 220px;
              height: 220px;
              display: block;
            }
            .instructions {
              margin-top: 18px;
              font-size: 13px;
              color: #14221d;
              font-weight: 500;
              line-height: 1.4;
            }
            .sub-instructions {
              margin-top: 6px;
              font-size: 11px;
              color: #667870;
            }
            .placement-badge {
              display: inline-block;
              margin-top: 16px;
              padding: 4px 10px;
              background: #edf6f2;
              color: #164f3c;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-label">Welcome To</div>
            <h1>${shopName}</h1>
            <p class="tagline">Licensed Pharmacy & Healthcare</p>
            <div class="qr-frame">
              <img src="${qrDataUrl}" alt="${shopName} QR Code" />
            </div>
            <div class="instructions">
              Point your phone camera here to review us or save our digital pharmacy card.
            </div>
            <div class="sub-instructions">
              Fast • Private • No app install required
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
      title="Store QR Codes & Counter Standees"
      description="Download high-resolution, print-ready QR codes for physical standees and customer cards."
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
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`${shopName} ${activeOption.title} QR Code`}
                className={styles.qrImage}
              />
            ) : (
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                Generating...
              </div>
            )}
            <span className={styles.qrCaption}>
              {shopName} • {activeOption.title}
            </span>
          </div>

          {/* Details & Controls */}
          <div className={styles.detailsCol}>
            <div className={styles.placementHeader}>
              <h4 className={styles.placementTitle}>
                <span>{activeOption.title} Standee</span>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </h4>
              <p className={styles.placementDesc}>{activeOption.description}</p>
            </div>

            {/* Target URL Display */}
            <div className={styles.urlBox}>
              <span className={styles.urlLabel}>Encoded Destination URL</span>
              <span className={styles.urlText}>{targetUrl}</span>
            </div>

            {/* Color Theme Selector */}
            <div className={styles.optionsRow}>
              <span className={styles.optionLabel}>QR Color:</span>
              <div className={styles.colorPicker}>
                <button
                  type="button"
                  className={`${styles.colorBtn} ${qrColor === '#123e35' ? styles.colorBtnActive : ''}`}
                  onClick={() => setQrColor('#123e35')}
                >
                  <span className={styles.colorSwatch} style={{ backgroundColor: '#123e35' }} />
                  <span>Pharmacy Green</span>
                </button>
                <button
                  type="button"
                  className={`${styles.colorBtn} ${qrColor === '#000000' ? styles.colorBtnActive : ''}`}
                  onClick={() => setQrColor('#000000')}
                >
                  <span className={styles.colorSwatch} style={{ backgroundColor: '#000000' }} />
                  <span>Classic Black</span>
                </button>
              </div>
            </div>

            {/* Download & Action Buttons */}
            <div className={styles.actionsGrid}>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDownloadPng}
                disabled={isGenerating || !qrDataUrl}
              >
                <Download size={14} style={{ marginRight: '5px' }} />
                High-Res PNG
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadSvg}
                disabled={isGenerating || !qrDataUrl}
              >
                <Download size={14} style={{ marginRight: '5px' }} />
                Print SVG
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check size={14} style={{ marginRight: '5px', color: 'var(--color-success)' }} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} style={{ marginRight: '5px' }} />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrintStandee}
                disabled={isGenerating || !qrDataUrl}
              >
                <Printer size={14} style={{ marginRight: '5px' }} />
                Print Standee
              </Button>
            </div>
          </div>
        </div>

        {/* Pro Tip Box */}
        <div className={styles.standeeTip}>
          <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <strong>Physical Printing Recommendation:</strong> For best durability, print on 300 GSM matte cardstock and display in an acrylic 4×6 inch tent stand at your billing counter.
          </div>
        </div>
      </div>
    </Modal>
  );
};

StoreQrModal.displayName = 'StoreQrModal';
