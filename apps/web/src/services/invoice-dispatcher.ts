// apps/web/src/services/invoice-dispatcher.ts
// Faza 20: Klijentsko slanje, dijeljenje i formatiranje poruka za račune

import { formatHrvatskiIznos } from '@obrtniq/core';
import { appLogger } from './logger';

export interface DispatchInvoiceParams {
  kupacEmail?: string;
  kupacNaziv: string;
  kupacTelefon?: string;
  brojDokumenta: string;
  datumIzdavanja: string;
  datumDospijeca: string;
  ukupniIznosEur: number;
  iban: string;
  bankaNaziv?: string;
  obrtNaziv: string;
  vlasnikNaziv: string;
  pozivNaBroj?: string;
}

/**
 * Generira strukturirani mailto: link s unaprijed pripremljenim tekstom na hrvatskom jeziku.
 */
export function buildMailtoUrl(params: DispatchInvoiceParams): string {
  const email = params.kupacEmail?.trim() || '';
  const subject = `Račun br. ${params.brojDokumenta} – ${params.obrtNaziv}`;

  const pozivNaBrojStr = params.pozivNaBroj || `HR00 ${params.brojDokumenta}`;
  const bankaStr = params.bankaNaziv ? ` (${params.bankaNaziv})` : '';
  const iznosStr = formatHrvatskiIznos(params.ukupniIznosEur);

  const body = `Poštovani / Poštovana ${params.kupacNaziv},

U privitku Vam dostavljamo račun br. ${params.brojDokumenta} od ${params.datumIzdavanja}.

Ukupni iznos za uplatu: ${iznosStr}
Rok plaćanja: ${params.datumDospijeca}
IBAN za uplatu: ${params.iban}${bankaStr}
Model i poziv na broj: ${pozivNaBrojStr}

Zahvaljujemo na suradnji!

Srdačan pozdrav,
${params.vlasnikNaziv}
${params.obrtNaziv}`;

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generira sažeti tekst prilagođen za WhatsApp, SMS ili Viber poruku kupcu.
 */
export function buildChatSummary(params: DispatchInvoiceParams): string {
  const iznosStr = formatHrvatskiIznos(params.ukupniIznosEur);
  const pozivNaBrojStr = params.pozivNaBroj || `HR00 ${params.brojDokumenta}`;

  return `Račun ${params.brojDokumenta} • ${params.obrtNaziv}
Iznos: ${iznosStr}
Rok plaćanja: ${params.datumDospijeca}
IBAN: ${params.iban}${params.bankaNaziv ? ` (${params.bankaNaziv})` : ''}
Model i poziv na broj: ${pozivNaBrojStr}

Hvala na suradnji!`;
}

/**
 * Generira link za izravno otvaranje WhatsApp web / app razgovora s pripremljenom porukom.
 */
export function buildWhatsAppUrl(summaryText: string, telefon?: string): string {
  const cleanPhone = (telefon || '').replace(/[^0-9]/g, '');
  const phoneParam = cleanPhone ? `&phone=${cleanPhone}` : '';
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}${phoneParam}`;
}

/**
 * Kopira tekst u međuspremnik (clipboard) uz siguran fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback za starije preglednike
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    appLogger.scope('DISPATCH:CLIPBOARD').warn('Kopiranje u međuspremnik nije uspjelo:', err);
    return false;
  }
}

/**
 * Pokreće izvorni Web Share API preglednika (npr. na mobilnim uređajima ili podržanim desktop OS-ovima).
 */
export async function shareInvoicePdf(
  pdfBlob: Blob,
  filename: string,
  params: DispatchInvoiceParams
): Promise<{ success: boolean; isFallback: boolean }> {
  try {
    const file = new File([pdfBlob], filename, { type: 'application/pdf' });
    const shareData = {
      title: `Račun ${params.brojDokumenta}`,
      text: buildChatSummary(params),
      files: [file],
    };

    if (navigator?.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      appLogger.scope('DISPATCH:WEBSHARE').info(`Račun ${params.brojDokumenta} uspješno podijeljen putem Web Share API-ja`);
      return { success: true, isFallback: false };
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      appLogger.scope('DISPATCH:WEBSHARE').warn('Web Share nije uspio ili je otkazan:', err);
    }
  }

  // Fallback: otvori mailto poveznicu
  const mailtoUrl = buildMailtoUrl(params);
  window.open(mailtoUrl, '_blank');
  return { success: true, isFallback: true };
}
