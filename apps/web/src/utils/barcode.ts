import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import { appLogger } from '../services/logger';

export interface BarcodeRenderOptions {
  scale?: number;
  height?: number; // mm
  columns?: number;
  eclevel?: number;
}

/**
 * Renderira HUB-3 PDF417 2D barkod na HTML5 Canvas element
 * Sukladno HUB standardu (Hrvatska udruga banaka)
 */
export async function renderHub3Barcode(
  canvas: HTMLCanvasElement,
  hub3Text: string,
  options?: BarcodeRenderOptions
): Promise<void> {
  if (!canvas || !hub3Text) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bwipFn = (bwipjs as any).toCanvas || (bwipjs as any).default?.toCanvas || (bwipjs as any).default;
    if (typeof bwipFn === 'function') {
      bwipFn(canvas, {
        bcid: 'pdf417',
        text: hub3Text,
        scale: options?.scale ?? 2,
        height: options?.height ?? 10,
        columns: options?.columns ?? 9,
        eclevel: options?.eclevel ?? 4, // HUB-3 standard specificira error correction level 4
      } as any);
      appLogger.scope('BARCODE:HUB3').debug('HUB-3 PDF417 barkod uspješno renderiran na canvas.');
    }
  } catch (err) {
    appLogger.scope('BARCODE:HUB3').error('Greška pri renderiranju HUB-3 PDF417 barkoda:', err);
    throw err;
  }
}

/**
 * Generira PNG Data URL za HUB-3 PDF417 barkod (za umetanje u PDF ili <img> tag)
 */
export async function getHub3BarcodeDataUrl(
  hub3Text: string,
  options?: BarcodeRenderOptions
): Promise<string> {
  const canvas = document.createElement('canvas');
  await renderHub3Barcode(canvas, hub3Text, options);
  return canvas.toDataURL('image/png');
}

/**
 * Renderira QR kod (EPC SEPA ili Fiskalni QR) na HTML5 Canvas element
 */
export async function renderQrCode(
  canvas: HTMLCanvasElement,
  qrText: string,
  width: number = 160
): Promise<void> {
  if (!canvas || !qrText) return;

  await QRCode.toCanvas(canvas, qrText, {
    width,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generira PNG Data URL za QR kod (za umetanje u PDF ili <img> tag)
 */
export async function getQrCodeDataUrl(
  qrText: string,
  width: number = 200
): Promise<string> {
  return QRCode.toDataURL(qrText, {
    width,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}
