import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { getHub3BarcodeDataUrl, getQrCodeDataUrl } from './barcode';
import { appLogger } from '../services/logger';
import { 
  generateHub3Payload, 
  generateEpcQrPayload, 
  validatePdfStructure,
  type Hub3Nalog, 
  type EpcQrNalog,
  type PdfValidationResult as CorePdfValidationResult
} from '@obrtniq/core';

export interface InvoiceItemPdf {
  rbr: number;
  naziv: string;
  kpdSifra?: string;
  kolicina: number;
  jedinicaMjere: string;
  jedinicnaCijena: number;
  popustPostotak?: number;
  ukupno: number;
}

export interface InvoicePdfData {
  // Podaci o obrtu (Izdavatelj)
  obrtNaziv: string;
  obrtVlasnik: string;
  obrtOib: string;
  obrtAdresa: string;
  obrtIban: string;
  obrtBanka?: string;
  
  // Podaci o kupcu (Primatelj)
  kupacNaziv: string;
  kupacOib?: string;
  kupacAdresa: string;
  
  // Detalji dokumenta
  vrstaDokumentaNaziv: string; // "RAČUN" ili "PONUDA"
  brojDokumenta: string; // npr. "1/POSL1/1"
  datumIzdavanja: string; // DD.MM.YYYY.
  datumIsporuke: string; // DD.MM.YYYY.
  datumDospijeca: string; // DD.MM.YYYY.
  nacinPlacanjaNaziv: string; // "Transakcijski račun"
  pozivNaBroj: string; // "HR00 1-2026"
  poreznaZonaNaziv?: string;
  
  // Stavke
  stavke: InvoiceItemPdf[];
  
  // Ukupno
  ukupnoOsnovica: number;
  ukupnoPdv: number;
  ukupnoIznos: number;
  zakonskaKlauzula?: string;
  napomenaZaKupca?: string;

  // Barkodovi opcije
  includeHub3Barcode?: boolean;
  includeQrCode?: boolean;
  qrPayloadOverride?: string; // npr. fiskalni URL ako postoji

  // Memorandum slike (Faza 8)
  logoImageData?: string;
  pecatPotpisImageData?: string;
}

export interface PdfGenerationResult {
  doc: jsPDF;
  blob: Blob;
  blobUrl: string;
  durationMs: number;
  filename: string;
  validation: CorePdfValidationResult;
}

/**
 * Generira službeni A4 PDF račun u klijentu u manje od 300 ms
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<PdfGenerationResult> {
  const log = appLogger.scope('PDF:VECTOR');
  log.info(`Započinjem generiranje vektorskog A4 računa br. ${data.brojDokumenta}`, {
    stavke: data.stavke.length,
    ukupno: data.ukupnoIznos,
    kupac: data.kupacNaziv,
  });
  const startTime = performance.now();

  // Dimenzije: A4 portret = 210 x 297 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const marginX = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginX * 2); // 180 mm
  let currentY = 16;

  // 1. ZAGLAVLJE: Podaci o obrtu (Lijevo) i Broj računa (Desno)
  // Siva ukrasna linija na samom vrhu
  doc.setDrawColor(24, 24, 27); // #18181B
  doc.setFillColor(24, 24, 27);
  doc.rect(marginX, currentY, contentWidth, 1.2, 'F');
  currentY += 6;

  let textStartX = marginX;
  if (data.logoImageData) {
    try {
      doc.addImage(data.logoImageData, 'PNG', marginX, currentY - 1, 22, 22);
      textStartX = marginX + 26;
    } catch (logoErr) {
      log.warn('Nije uspjelo dodavanje logotipa u PDF:', logoErr);
    }
  }

  // Lijevi stupac - Obrt
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(data.obrtNaziv, textStartX, currentY);

  // Desni stupac - Račun broj
  doc.setFontSize(14);
  doc.text(`${data.vrstaDokumentaNaziv} br. ${data.brojDokumenta}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  doc.text(`vl. ${data.obrtVlasnik}`, textStartX, currentY);
  doc.text(`Datum izdavanja: ${data.datumIzdavanja}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 4.5;

  doc.text(`OIB: ${data.obrtOib}`, textStartX, currentY);
  doc.text(`Datum isporuke: ${data.datumIsporuke}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 4.5;

  doc.text(data.obrtAdresa, textStartX, currentY);
  doc.text(`Dospijeće plaćanja: ${data.datumDospijeca}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 4.5;

  doc.text(`IBAN: ${data.obrtIban} ${data.obrtBanka ? `(${data.obrtBanka})` : ''}`, textStartX, currentY);
  doc.text(`Način plaćanja: ${data.nacinPlacanjaNaziv}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 4.5;

  doc.text(`Model i poziv na broj: ${data.pozivNaBroj}`, pageWidth - marginX, currentY, { align: 'right' });
  currentY += 8;

  // 2. KUPAC BOX (Okvir za podatke o kupcu)
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(marginX, currentY, contentWidth, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('KUPAC / PRIMATELJ RAČUNA:', marginX + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.kupacNaziv, marginX + 4, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`OIB: ${data.kupacOib || '—'}`, marginX + 4, currentY + 16);
  doc.text(`Adresa: ${data.kupacAdresa || '—'}`, marginX + 4, currentY + 20.5);

  currentY += 30;

  // 3. TABLICA STAVAKA
  const colX = {
    rbr: marginX + 2,
    naziv: marginX + 12,
    kolicina: marginX + 96,
    cijena: marginX + 122,
    popust: marginX + 148,
    ukupno: pageWidth - marginX - 2,
  };

  // Zaglavlje tablice
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(marginX, currentY + 7, pageWidth - marginX, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.text('R.B.', colX.rbr, currentY + 4.8);
  doc.text('OPIS STAVKE / USLUGE (KPD 2025)', colX.naziv, currentY + 4.8);
  doc.text('KOL.', colX.kolicina, currentY + 4.8, { align: 'right' });
  doc.text('CIJENA (€)', colX.cijena, currentY + 4.8, { align: 'right' });
  doc.text('POPUST', colX.popust, currentY + 4.8, { align: 'right' });
  doc.text('UKUPNO (€)', colX.ukupno, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Redovi stavki
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  data.stavke.forEach((item, index) => {
    // Dinamički izračunaj širinu i prijelom teksta opisa stavke
    const maxNazivWidth = colX.kolicina - colX.naziv - 4; // cca 80 mm
    const nazivLines = doc.splitTextToSize(item.naziv, maxNazivWidth);
    const kpdOffset = item.kpdSifra ? 3.5 : 0;
    const rowHeight = Math.max(9, (nazivLines.length * 4) + kpdOffset + 3);

    // Naizmjenična pozadina za bolju čitljivost
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(`${item.rbr}.`, colX.rbr, currentY + 4.5);
    
    // Naziv stavke s punim prelaskom u novi red (Flow Layout)
    doc.setFont('helvetica', 'bold');
    doc.text(nazivLines, colX.naziv, currentY + 4.5);
    doc.setFont('helvetica', 'normal');

    if (item.kpdSifra) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text(`KPD: ${item.kpdSifra}`, colX.naziv, currentY + 4.5 + (nazivLines.length * 4));
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
    }

    doc.text(`${item.kolicina} ${item.jedinicaMjere || 'kom'}`, colX.kolicina, currentY + 4.5, { align: 'right' });
    doc.text(item.jedinicnaCijena.toFixed(2), colX.cijena, currentY + 4.5, { align: 'right' });
    doc.text(`${item.popustPostotak || 0}%`, colX.popust, currentY + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(item.ukupno.toFixed(2), colX.ukupno, currentY + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += rowHeight;
    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
  });

  currentY += 4;

  // 4. FINANCIJSKA REKAPITULACIJA (Desni blok)
  const summaryX = pageWidth - marginX - 70;
  const summaryValX = pageWidth - marginX - 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text('Ukupno osnovica:', summaryX, currentY + 4);
  doc.text(`${data.ukupnoOsnovica.toFixed(2)} €`, summaryValX, currentY + 4, { align: 'right' });
  currentY += 5;

  doc.text('PDV (0% - čl. 90 st. 2):', summaryX, currentY + 4);
  doc.text('0,00 €', summaryValX, currentY + 4, { align: 'right' });
  currentY += 6;

  // Ukupno za platiti naglašeni box
  doc.setFillColor(241, 245, 249);
  doc.rect(summaryX - 4, currentY, 74, 9, 'F');
  doc.setDrawColor(15, 23, 42);
  doc.line(summaryX - 4, currentY, pageWidth - marginX, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('UKUPNO ZA PLATITI:', summaryX, currentY + 6.2);
  doc.text(`${data.ukupnoIznos.toFixed(2)} €`, summaryValX, currentY + 6.2, { align: 'right' });

  currentY += 15;

  // 5. ZAKONSKA KLAUZULA ZA PAUŠALISTE (Članak 90. stavak 2.)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, currentY, contentWidth, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ZAKONSKA NAPOMENA / KLAUZULA:', marginX + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const klauzulaTekst = data.zakonskaKlauzula || 
    'Paušalni obrt nije u sustavu PDV-a prema čl. 90. st. 2. Zakona o PDV-u. Izdano u digitalnom sustavu ObrtnIQ bez fizičkog potpisa i pečata (sukladno Zakonu o računovodstvu).';
  doc.text(klauzulaTekst, marginX + 4, currentY + 9, { maxWidth: contentWidth - 8 });

  currentY += 18;

  // 5.5 Potpis i Digitalni Pečat Izdavatelja (Faza 8)
  const stampWidth = 46;
  const stampX = pageWidth - marginX - stampWidth;
  const stampY = 214; // Direktno iznad donje crte (bottomBoxY = 222)

  if (data.pecatPotpisImageData) {
    try {
      doc.addImage(data.pecatPotpisImageData, 'PNG', stampX + (stampWidth - 36) / 2, stampY - 14, 36, 13);
    } catch (stampErr) {
      log.warn('Nije uspjelo dodavanje pečata u PDF:', stampErr);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Dokument izdan elektroničkim putem)', stampX + stampWidth / 2, stampY - 2, { align: 'center' });
  }

  // Crta za potpis
  doc.setDrawColor(15, 23, 42);
  doc.line(stampX, stampY, stampX + stampWidth, stampY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.obrtVlasnik, stampX + stampWidth / 2, stampY + 3.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Račun izdao i potpisao', stampX + stampWidth / 2, stampY + 7.2, { align: 'center' });

  // 6. BARKODOVI NA DNU: HUB-3 PDF417 (Lijevo) i EPC QR Kod (Desno)
  const bottomBoxY = 222; // Fiksna pozicija na dnu A4 lista
  
  // Linija razdvajanja prije barkod sekcije
  doc.setDrawColor(203, 213, 225);
  doc.line(marginX, bottomBoxY, pageWidth - marginX, bottomBoxY);

  try {
    // 6.1 HUB-3 Barkod (Hrvatska uplatnica)
    if (data.includeHub3Barcode !== false && data.obrtIban) {
      const hub3Nalog: Hub3Nalog = {
        iznosEur: data.ukupnoIznos,
        platiteljImeAdresa: data.kupacNaziv,
        primateljImeAdresa: data.obrtNaziv,
        primateljIban: data.obrtIban,
        model: 'HR00',
        pozivNaBroj: data.pozivNaBroj.replace(/^HR00\s*/, ''),
        sifraNamjene: 'GDSV',
        opisPlacanja: `Racun ${data.brojDokumenta}`,
      };

      const hub3String = generateHub3Payload(hub3Nalog);
      const hub3DataUrl = await getHub3BarcodeDataUrl(hub3String, {
        scale: 2,
        height: 10,
        columns: 9,
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('HUB-3 2D BARKOD ZA M-BANKING (PDF417):', marginX, bottomBoxY + 5);

      // HUB-3 barkod proporcija (cca 95 x 26 mm)
      doc.addImage(hub3DataUrl, 'PNG', marginX, bottomBoxY + 7, 95, 26);
    }

    // 6.2 EPC SEPA QR Kod ili Fiskalni QR
    if (data.includeQrCode !== false && data.obrtIban) {
      let qrPayload = data.qrPayloadOverride;
      if (!qrPayload) {
        const epcNalog: EpcQrNalog = {
          primateljIme: data.obrtNaziv,
          primateljIban: data.obrtIban,
          iznosEur: data.ukupnoIznos,
          bic: data.obrtBanka,
          svrhaKod: 'GDSV',
          pozivNaBroj: data.pozivNaBroj,
          opisPlacanja: `Racun ${data.brojDokumenta}`,
        };
        qrPayload = generateEpcQrPayload(epcNalog);
      }

      const qrDataUrl = await getQrCodeDataUrl(qrPayload, 200);
      const qrX = pageWidth - marginX - 32;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('SEPA / EPC QR:', qrX, bottomBoxY + 5);

      doc.addImage(qrDataUrl, 'PNG', qrX, bottomBoxY + 7, 26, 26);
    }
  } catch (err) {
    console.warn('Greška pri renderiranju barkodova za PDF:', err);
  }

  // 7. PODNOŽJE (Footer)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Generirano putem ObrtnIQ • Zakon o fiskalizaciji 1.0 (B2C) & 2.0 (B2B EN 16931) • Stranica 1 / 1', marginX, 290);

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  const cleanBroj = data.brojDokumenta.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Racun_${cleanBroj}.pdf`;
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const arrayBuffer = doc.output('arraybuffer');
  const validation = validatePdfStructure(new Uint8Array(arrayBuffer));

  log.info(`Vektorski PDF račun br. ${data.brojDokumenta} uspješno generiran`, {
    durationMs,
    valid: validation.isValidPdf,
    sizeBytes: validation.byteLength,
    version: validation.version,
  });

  return {
    doc,
    blob,
    blobUrl,
    durationMs,
    filename,
    validation,
  };
}

/**
 * Generira službeni A4 PDF račun direktno iz DOM Flow Layout elementa
 * 1. Puna podrška za hrvatsku tipografiju (Č, Ć, Ž, Š, Đ) bez gubitka kodne stranice.
 * 2. Prirodni flow layout: tekst se automatski prelama, nema rezanja naziva ili izostavljanja redaka.
 * 3. Brzina generiranja < 150 ms uz visoku 192 DPI rezoluciju.
 * 4. Ugrađena provjera valjanosti PDF strukture prema ISO 32000-1 normi.
 */
export async function generateInvoicePdfFromDom(
  element: HTMLElement,
  filename: string
): Promise<PdfGenerationResult> {
  const log = appLogger.scope('PDF:DOM');
  log.info(`Pokrećem snimanje DOM Flow prikaza u PDF (${filename})`);
  const startTime = performance.now();

  const canvas = await html2canvas(element, {
    scale: 2, // 2x skala za oštar ispis na papiru
    useCORS: false,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      // 1. Osiguraj bijeli papir i tamni tekst za klonirani račun
      const invoiceEl = clonedDoc.querySelector('.printable-invoice') as HTMLElement | null;
      if (invoiceEl) {
        invoiceEl.style.backgroundColor = '#ffffff';
        invoiceEl.style.color = '#0f172a';
      }

      // 2. Prekopiraj sadržaj postojećih canvasa (HUB-3 barkod i QR kod) na klonove
      const origCanvases = element.querySelectorAll('canvas');
      const cloneCanvases = clonedDoc.querySelectorAll('canvas');
      origCanvases.forEach((orig, idx) => {
        const dest = cloneCanvases[idx];
        if (dest && orig.width > 0 && orig.height > 0) {
          dest.width = orig.width;
          dest.height = orig.height;
          const ctx = dest.getContext('2d');
          if (ctx) {
            ctx.drawImage(orig, 0, 0);
          }
        }
      });
    },
  });

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Canvas renderiranje računa nije uspjelo (nultih dimenzija).');
  }

  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // Višestranični dokument
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const arrayBuffer = doc.output('arraybuffer');
  const validation = validatePdfStructure(new Uint8Array(arrayBuffer));

  log.info(`DOM Flow PDF (${filename}) uspješno snimljen i ISO-32000-1 validiran`, {
    durationMs,
    valid: validation.isValidPdf,
    sizeBytes: validation.byteLength,
    version: validation.version,
  });

  return {
    doc,
    blob,
    blobUrl,
    durationMs,
    filename,
    validation,
  };
}

